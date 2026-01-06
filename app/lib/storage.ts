import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// Environment variables
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || '';
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || '';
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!GCS_BUCKET_NAME) {
    console.warn('⚠️ GCS_BUCKET_NAME not set. File storage will not work.');
}

// Initialize Google Cloud Storage
let storage: Storage | null = null;
let bucket: any = null;
let initializationError: Error | null = null;

function initializeStorage(): void {
    if (storage) return; // Already initialized
    
    try {
        // If GOOGLE_APPLICATION_CREDENTIALS is a JSON string (for Vercel), parse it
        if (GOOGLE_APPLICATION_CREDENTIALS && GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
            const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS);
            storage = new Storage({
                projectId: GCP_PROJECT_ID,
                credentials,
            });
        } else {
            // Use default credentials or key file path
            storage = new Storage({
                projectId: GCP_PROJECT_ID,
                keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
            });
        }

        if (GCS_BUCKET_NAME && storage) {
            bucket = storage.bucket(GCS_BUCKET_NAME);
        }

        console.log('✅ Google Cloud Storage initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Google Cloud Storage:', error);
        initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
    }
}

// Lazy initialization
function ensureInitialized(): void {
    if (!storage) {
        initializeStorage();
    }
    if (initializationError) {
        throw initializationError;
    }
}

/**
 * File metadata interface
 */
export interface FileMetadata {
    id: string;
    name: string;
    path: string;
    size: number;
    contentType: string;
    url: string;
    created: Date;
    updated: Date;
}

/**
 * Upload a file to Google Cloud Storage with retry logic
 */
export async function uploadFile(
    file: Buffer | Uint8Array,
    fileName: string,
    contentType: string,
    userId?: string,
    folder?: string,
    maxRetries: number = 3
): Promise<FileMetadata> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized. Check GCS_BUCKET_NAME environment variable.');
    }

    // Validate inputs
    if (!file || file.length === 0) {
        throw new Error('File data is empty or invalid');
    }

    if (!fileName) {
        throw new Error('File name is required');
    }

    // Generate unique file path
    const fileId = uuidv4();
    const extension = fileName.split('.').pop() || 'bin';
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const userFolder = userId ? `users/${userId}` : 'public';
    const folderPath = folder ? `${folder}/` : '';
    const filePath = `${userFolder}/${folderPath}${fileId}.${extension}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Upload to GCS
            const gcsFile = bucket.file(filePath);
            
            await gcsFile.save(file, {
                contentType,
                resumable: false, // Disable resumable uploads for small files (more reliable)
                validation: 'crc32c',
                metadata: {
                    originalName: fileName,
                    fileId,
                    userId: userId || 'anonymous',
                },
            });

            // Get file metadata
            const [metadata] = await gcsFile.getMetadata();

            return {
                id: fileId,
                name: sanitizedName,
                path: filePath,
                size: parseInt(metadata.size || '0'),
                contentType: metadata.contentType || contentType,
                url: `gs://${GCS_BUCKET_NAME}/${filePath}`,
                created: new Date(metadata.timeCreated),
                updated: new Date(metadata.updated),
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`Upload attempt ${attempt}/${maxRetries} failed:`, lastError.message);
            
            if (attempt < maxRetries) {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
            }
        }
    }

    throw new Error(`Failed to upload file after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Read a file from Google Cloud Storage with retry logic
 */
export async function readFile(filePath: string, maxRetries: number = 3): Promise<Buffer> {
    ensureInitialized();
    
    if (!bucket) {
        console.error('❌ GCS bucket not initialized');
        throw new Error('GCS bucket not initialized. Check GCS_BUCKET_NAME environment variable.');
    }

    if (!filePath) {
        throw new Error('File path is required');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const file = bucket.file(filePath);
            const [exists] = await file.exists();

            if (!exists) {
                throw new Error(`File not found: ${filePath}`);
            }

            const [contents] = await file.download();
            return contents;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            // Don't retry for "not found" errors
            if (lastError.message.includes('not found')) {
                throw lastError;
            }
            
            console.warn(`Read attempt ${attempt}/${maxRetries} failed:`, lastError.message);
            
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 300 * attempt));
            }
        }
    }

    throw lastError || new Error(`Failed to read file after ${maxRetries} attempts`);
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    try {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();

        if (!exists) {
            return null;
        }

        const [metadata] = await file.getMetadata();

        return {
            id: metadata.metadata?.fileId || filePath,
            name: metadata.metadata?.originalName || filePath.split('/').pop() || 'unknown',
            path: filePath,
            size: parseInt(metadata.size || '0'),
            contentType: metadata.contentType || 'application/octet-stream',
            url: `gs://${GCS_BUCKET_NAME}/${filePath}`,
            created: new Date(metadata.timeCreated),
            updated: new Date(metadata.updated),
        };
    } catch (error) {
        console.error('Error getting file metadata:', error);
        return null;
    }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    try {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();

        if (exists) {
            await file.delete();
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        // Don't throw - deletion failure shouldn't block operations
    }
}

/**
 * List files in a folder
 */
export async function listFiles(
    userId?: string,
    folder?: string,
    limit?: number
): Promise<FileMetadata[]> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    const userFolder = userId ? `users/${userId}` : 'public';
    const prefix = folder ? `${userFolder}/${folder}/` : `${userFolder}/`;

    const [files] = await bucket.getFiles({
        prefix,
        maxResults: limit || 1000,
    });

    return files.map((file: any) => ({
        id: file.metadata?.metadata?.fileId || file.name,
        name: file.metadata?.metadata?.originalName || file.name.split('/').pop(),
        path: file.name,
        size: parseInt(file.metadata?.size || '0'),
        contentType: file.metadata?.contentType || 'application/octet-stream',
        url: `gs://${GCS_BUCKET_NAME}/${file.name}`,
        created: new Date(file.metadata?.timeCreated),
        updated: new Date(file.metadata?.updated),
    }));
}

/**
 * Generate a signed URL for temporary public access
 */
export async function getSignedUrl(
    filePath: string,
    expiresIn: number = 3600 // 1 hour default
): Promise<string> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
        throw new Error('File not found');
    }

    const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
    });

    return url;
}

/**
 * Copy a file within the bucket
 */
export async function copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    const sourceFile = bucket.file(sourcePath);
    const [exists] = await sourceFile.exists();

    if (!exists) {
        throw new Error('Source file not found');
    }

    await sourceFile.copy(bucket.file(destinationPath));
}

/**
 * Move a file within the bucket
 */
export async function moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    await copyFile(sourcePath, destinationPath);
    await deleteFile(sourcePath);
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
}

/**
 * Get file size
 */
export async function getFileSize(filePath: string): Promise<number> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();
    return parseInt(metadata.size || '0');
}

/**
 * Make a file publicly accessible
 */
export async function makeFilePublic(filePath: string): Promise<string> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    const file = bucket.file(filePath);
    await file.makePublic();

    return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filePath}`;
}

/**
 * Make a file private (remove public access)
 */
export async function makeFilePrivate(filePath: string): Promise<void> {
    ensureInitialized();
    
    if (!bucket) {
        throw new Error('GCS bucket not initialized');
    }

    const file = bucket.file(filePath);
    await file.makePrivate();
}