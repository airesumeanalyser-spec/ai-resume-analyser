import type { VercelRequest, VercelResponse } from '@vercel/node';
import busboy from 'busboy';
import { requireAuth } from '../app/lib/auth';
import { uploadFile, readFile, deleteFile, listFiles, getFileMetadata } from '../app/lib/storage';
import { deleteResume, createResume } from '../app/lib/db';

/**
 * Unified Files endpoint handling all file operations
 * 
 * Supported actions:
 * - POST /api/files?action=upload - Upload files (multipart)
 * - GET /api/files?action=read&path=<path> - Read a file
 * - POST /api/files?action=write - Write/update a file
 * - POST /api/files?action=delete - Delete a file
 * - GET /api/files?action=list&path=<path> - List files in folder
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Require authentication
        const user = await requireAuth(req, res);
        if (!user) return;

        const action = (req.query.action as string) || 'read';

        // Route to appropriate handler based on action
        switch (action) {
            case 'upload':
                if (req.method !== 'POST') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleUpload(req, res, user);

            case 'read':
                if (req.method !== 'GET') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleRead(req, res, user);

            case 'write':
                if (req.method !== 'POST') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleWrite(req, res, user);

            case 'delete':
                if (req.method !== 'POST') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleDelete(req, res, user);

            case 'list':
                if (req.method !== 'GET') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleList(req, res, user);

            default:
                return res.status(400).json({
                    error: `Unknown action: ${action}`,
                });
        }
    } catch (error) {
        console.error('Files endpoint error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

interface FileUploadData {
    buffer: Buffer;
    filename: string;
    mimeType: string;
}

async function handleUpload(req: VercelRequest, res: VercelResponse, user: any) {
    try {
        const contentType = req.headers['content-type'] || '';

        if (!contentType.includes('multipart/form-data')) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Content-Type must be multipart/form-data',
            });
        }

        const files: FileUploadData[] = [];

        let rawBody: Buffer;

        if (req.body && Buffer.isBuffer(req.body)) {
            rawBody = req.body;
        } else if (req.body && typeof req.body === 'string') {
            rawBody = Buffer.from(req.body);
        } else if (typeof (req as any).on === 'function') {
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
                (req as any).on('data', (chunk: Buffer) => chunks.push(chunk));
                (req as any).on('end', () => resolve());
                (req as any).on('error', reject);
            });
            rawBody = Buffer.concat(chunks);
        } else {
            rawBody = Buffer.from(JSON.stringify(req.body || ''));
        }

        await new Promise<void>((resolve, reject) => {
            const bb = busboy({ headers: req.headers as busboy.BusboyConfig['headers'] });

            bb.on('file', (fieldname: string, file: NodeJS.ReadableStream, info: busboy.FileInfo) => {
                const { filename, encoding, mimeType } = info;
                const fileChunks: Buffer[] = [];

                file.on('data', (data: Buffer) => {
                    fileChunks.push(data);
                });

                file.on('end', () => {
                    files.push({
                        buffer: Buffer.concat(fileChunks),
                        filename: filename || 'unnamed',
                        mimeType: mimeType || 'application/octet-stream',
                    });
                });

                file.on('error', reject);
            });

            bb.on('finish', () => {
                resolve();
            });

            bb.on('error', reject);

            bb.end(rawBody);
        });

        if (files.length === 0) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'No files provided',
            });
        }

        // Upload all files and create resume records
        const uploadedItems = [];

        for (const file of files) {
            const uploadedFile = await uploadFile(
                file.buffer,
                file.filename,
                file.mimeType,
                user.id
            );

            uploadedItems.push({
                id: uploadedFile.id,
                uid: uploadedFile.id,
                name: uploadedFile.name,
                path: uploadedFile.path,
                is_dir: false,
                size: uploadedFile.size,
                created: uploadedFile.created.getTime(),
                modified: uploadedFile.updated.getTime(),
                accessed: uploadedFile.updated.getTime(),
                writable: true,
                parent_id: null,
                parent_uid: null,
            });
        }

        // Return first uploaded file or all
        return res.status(200).json(uploadedItems[0] || uploadedItems);
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleRead(req: VercelRequest, res: VercelResponse, user: any) {
    try {
        const { path } = req.query;

        if (!path || typeof path !== 'string') {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Path parameter is required',
            });
        }

        // Security: Ensure user can only access their own files
        const userPrefix = `users/${user.id}/`;
        if (!path.startsWith(userPrefix)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only access your own files',
            });
        }

        // Get file metadata for content type
        const metadata = await getFileMetadata(path);

        if (!metadata) {
            return res.status(404).json({
                error: 'Not found',
                message: 'File not found',
            });
        }

        // Read file from GCS
        const fileBuffer = await readFile(path);

        // Set appropriate headers
        res.setHeader('Content-Type', metadata.contentType);
        res.setHeader('Content-Length', metadata.size.toString());
        res.setHeader('Content-Disposition', `inline; filename="${metadata.name}"`);

        return res.status(200).send(fileBuffer);
    } catch (error) {
        console.error('Read file error:', error);

        if (error instanceof Error && error.message === 'File not found') {
            return res.status(404).json({
                error: 'Not found',
                message: 'File not found',
            });
        }

        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleWrite(req: VercelRequest, res: VercelResponse, user: any) {
    try {
        const { path, content, file } = req.body;

        if (!path || typeof path !== 'string') {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Path is required',
            });
        }

        // Security: Ensure user can only write to their own files
        const userPrefix = `users/${user.id}/`;
        if (!path.startsWith(userPrefix)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only write to your own files',
            });
        }

        let fileBuffer: Buffer;
        let contentType = 'text/plain';
        let fileName = path.split('/').pop() || 'file';

        if (file) {
            fileBuffer = Buffer.from(file.buffer || file);
            contentType = file.type || file.mimetype || 'application/octet-stream';
            fileName = file.name || file.originalname || fileName;
        } else if (content) {
            fileBuffer = Buffer.from(content, 'utf-8');
        } else {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Either file or content is required',
            });
        }

        const uploadedFile = await uploadFile(
            fileBuffer,
            fileName,
            contentType,
            user.id
        );

        return res.status(200).json({
            success: true,
            file: {
                id: uploadedFile.id,
                name: uploadedFile.name,
                path: uploadedFile.path,
                size: uploadedFile.size,
            },
        });
    } catch (error) {
        console.error('Write file error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
    try {
        const { path } = req.body;

        if (!path || typeof path !== 'string') {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Path is required',
            });
        }

        // Security: Ensure user can only delete their own files
        const userPrefix = `users/${user.id}/`;
        if (!path.startsWith(userPrefix)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete your own files',
            });
        }

        await deleteFile(path);

        try {
            const fileId = path.split('/').pop()?.split('.')[0];
            if (fileId) {
                await deleteResume(fileId);
            }
        } catch (dbError) {
            console.warn('Failed to delete from database:', dbError);
        }

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete file error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleList(req: VercelRequest, res: VercelResponse, user: any) {
    try {
        const { path } = req.query;
        const folderPath = path && typeof path === 'string' ? path : '';

        if (folderPath) {
            const userPrefix = `users/${user.id}/`;
            if (!folderPath.startsWith(userPrefix)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only list your own files',
                });
            }
        }

        const files = await listFiles(user.id, folderPath);

        const formattedFiles = files.map(file => ({
            id: file.id,
            uid: file.id,
            name: file.name,
            path: file.path,
            is_dir: false,
            size: file.size,
            created: file.created.getTime(),
            modified: file.updated.getTime(),
            accessed: file.updated.getTime(),
            writable: true,
            parent_id: null,
            parent_uid: null,
        }));

        return res.status(200).json(formattedFiles);
    } catch (error) {
        console.error('List files error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
