import type { VercelRequest, VercelResponse } from '@vercel/node';
import busboy from 'busboy';
import { 
    chat, 
    generateFeedback,
    extractTextFromFile,
    extractTextFromImage,
    convertResumeToMarkdown,
    rebuildResume,
    analyzeResume,
    getInlineSuggestions,
} from '../app/lib/ai';
import { applyAISuggestions, analysisToSuggestions } from '../app/lib/resume-parser';
import type { ChatMessage } from '../app/lib/ai';
import { requireAuth, getAuthenticatedUser } from '../app/lib/auth';
import { incrementTrialUsage, canUseFreeTrial } from '../app/lib/db';

/**
 * Unified AI endpoint handling multiple AI operations
 * POST /api/ai?action=<action>
 * 
 * Supported actions:
 * - chat: General AI chat with conversation history
 * - feedback: Generate AI feedback for resume
 * - img2txt: Extract text from images/PDFs (multipart)
 * - convert-to-markdown: Convert resume text to markdown
 * - rebuild-resume: Rebuild resume with suggestions
 * - analyze: Analyze resume (optional)
 * - inline-suggestions: Get inline suggestions
 * - apply-suggestions: Apply AI suggestions to markdown
 * - extract-jd: Extract JD information from file (multipart)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST and GET
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
        });
    }

    try {
        // Require authentication
        const user = await requireAuth(req, res);
        if (!user) return;

        const action = (req.query.action as string) || 'chat';

        // Route to appropriate handler based on action
        switch (action) {
            case 'chat':
                return handleChat(req, res);
            case 'feedback':
                return handleFeedback(req, res);
            case 'img2txt':
                return handleImg2txt(req, res);
            case 'convert-to-markdown':
                return handleConvertToMarkdown(req, res);
            case 'rebuild-resume':
                return handleRebuildResume(req, res);
            case 'analyze':
                return handleAnalyze(req, res);
            case 'inline-suggestions':
                return handleInlineSuggestions(req, res);
            case 'apply-suggestions':
                return handleApplySuggestions(req, res);
            case 'extract-jd':
                return handleExtractJD(req, res);
            case 'use-trial':
                return handleUseTrial(req, res, user);
            case 'check-trial':
                return handleCheckTrial(req, res, user);
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown action: ${action}`,
                });
        }
    } catch (error) {
        console.error('AI endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

async function handleChat(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { messages, temperature, maxTokens } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Messages array is required',
            });
        }

        for (const msg of messages) {
            if (!msg.role || !msg.content) {
                return res.status(400).json({
                    success: false,
                    error: 'Each message must have role and content',
                });
            }
            if (!['user', 'assistant', 'system'].includes(msg.role)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid message role',
                });
            }
        }

        const response = await chat(messages as ChatMessage[], {
            temperature: temperature || 0.7,
            maxTokens: maxTokens || 2048,
        });

        return res.status(200).json({
            success: true,
            response,
        });
    } catch (error) {
        console.error('Chat error:', error);
        if (error instanceof Error && error.message.includes('not initialized')) {
            return res.status(503).json({
                success: false,
                error: 'AI service is not available',
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Failed to process chat request',
        });
    }
}

async function handleFeedback(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { resumeText, section, question } = req.body;

        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'resumeText is required',
            });
        }

        if (!section || typeof section !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'section is required',
            });
        }

        const feedback = await generateFeedback(resumeText, section, question);

        return res.status(200).json({
            success: true,
            feedback,
        });
    } catch (error) {
        console.error('Feedback error:', error);
        if (error instanceof Error && error.message.includes('not initialized')) {
            return res.status(503).json({
                success: false,
                error: 'AI service is not available',
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Failed to generate feedback',
        });
    }
}

async function handleImg2txt(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('multipart/form-data')) {
            // Get raw body as buffer
            let rawBody: Buffer;

            if (req.body && Buffer.isBuffer(req.body)) {
                rawBody = req.body;
                console.log('Using body as Buffer directly');
            } else if (req.body && typeof req.body === 'string') {
                rawBody = Buffer.from(req.body, 'latin1');
                console.log('Converted string body to buffer with latin1 encoding');
            } else if (typeof (req as any).on === 'function') {
                const chunks: Buffer[] = [];
                await new Promise<void>((resolve, reject) => {
                    (req as any).on('data', (chunk: Buffer) => chunks.push(chunk));
                    (req as any).on('end', () => resolve());
                    (req as any).on('error', reject);
                });
                rawBody = Buffer.concat(chunks);
                console.log('Read body from request stream');
            } else {
                rawBody = Buffer.from(JSON.stringify(req.body || ''));
                console.log('Created buffer from JSON body');
            }

            let imageBuffer: Buffer | null = null;
            let imageUrl: string | null = null;

            await new Promise<void>((resolve, reject) => {
                const bb = busboy({ headers: req.headers as busboy.BusboyConfig['headers'] });

                bb.on('file', (fieldname: string, file: NodeJS.ReadableStream, info: busboy.FileInfo) => {
                    const chunks: Buffer[] = [];

                    file.on('data', (data: Buffer) => {
                        chunks.push(data);
                    });

                    file.on('end', () => {
                        imageBuffer = Buffer.concat(chunks);
                        console.log('Image buffer received:', {
                            fieldname,
                            filename: info.filename,
                            mimeType: info.mimeType,
                            bufferLength: imageBuffer.length,
                        });
                    });

                    file.on('error', reject);
                });

                bb.on('field', (fieldname: string, val: string) => {
                    if (fieldname === 'imageUrl') {
                        imageUrl = val;
                    }
                });

                bb.on('finish', () => {
                    resolve();
                });

                bb.on('error', reject);

                bb.end(rawBody);
            });

            if (!imageBuffer && !imageUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'No image provided in multipart data',
                });
            }

            let extractedText: string;

            if (imageBuffer) {
                console.log('🖼️ Extracting text from image buffer');
                extractedText = await extractTextFromImage(imageBuffer);
            } else if (imageUrl) {
                console.log('📂 Extracting text from file path:', imageUrl);
                extractedText = await extractTextFromFile(imageUrl);
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'No valid image data provided',
                });
            }

            return res.status(200).json({
                success: true,
                text: extractedText,
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Content-Type must be multipart/form-data',
            });
        }
    } catch (error) {
        console.error('img2txt error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to extract text',
        });
    }
}

async function handleConvertToMarkdown(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { resumeText } = req.body;

        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'resumeText is required',
            });
        }

        const markdown = await convertResumeToMarkdown(resumeText);

        return res.status(200).json({
            success: true,
            markdown,
        });
    } catch (error) {
        console.error('Convert to markdown error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to convert to markdown',
        });
    }
}

async function handleRebuildResume(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { resumeText, feedback, jobDescription } = req.body;

        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'resumeText is required',
            });
        }

        const rebuilt = await rebuildResume(resumeText, feedback, jobDescription);

        return res.status(200).json({
            success: true,
            rebuiltResume: rebuilt,
        });
    } catch (error) {
        console.error('Rebuild resume error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to rebuild resume',
        });
    }
}

async function handleAnalyze(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'resumeText is required',
            });
        }

        const analysis = await analyzeResume(resumeText, jobDescription);

        return res.status(200).json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error('Analyze error:', error);
        if (error instanceof Error && error.message.includes('Failed to analyze')) {
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Failed to analyze resume',
        });
    }
}

async function handleInlineSuggestions(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'resumeText is required',
            });
        }

        const suggestions = await getInlineSuggestions(resumeText, jobDescription);

        return res.status(200).json({
            success: true,
            suggestions,
        });
    } catch (error) {
        console.error('Inline suggestions error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get inline suggestions',
        });
    }
}

async function handleApplySuggestions(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { markdown, analysis, selectedIds } = req.body;

        if (!markdown || typeof markdown !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'markdown is required',
            });
        }

        if (!analysis || typeof analysis !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'analysis is required',
            });
        }

        const suggestions = analysisToSuggestions(analysis);
        
        // Filter suggestions if selectedIds provided
        const suggestionsToApply = selectedIds && Array.isArray(selectedIds)
            ? suggestions.filter((_: any, idx: number) => selectedIds.includes(idx))
            : suggestions;

        const updatedMarkdown = applyAISuggestions(markdown, suggestionsToApply);

        return res.status(200).json({
            success: true,
            updatedMarkdown,
            appliedCount: suggestionsToApply.length,
        });
    } catch (error) {
        console.error('Apply suggestions error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to apply suggestions',
        });
    }
}

async function handleExtractJD(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const contentType = req.headers['content-type'] || '';

        // Log the actual content-type for debugging
        console.log('Extract JD Content-Type:', contentType);

        if (!contentType.includes('multipart/form-data') && !contentType.includes('multipart')) {
            return res.status(400).json({
                success: false,
                error: 'Content-Type must be multipart/form-data',
            });
        }

        // Parse multipart data
        let fileBuffer: Buffer | null = null;

        let rawBody: Buffer;
        if (req.body && Buffer.isBuffer(req.body)) {
            rawBody = req.body;
        } else if (req.body && typeof req.body === 'string') {
            rawBody = Buffer.from(req.body, 'latin1');
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
                const chunks: Buffer[] = [];

                file.on('data', (data: Buffer) => {
                    chunks.push(data);
                });

                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                    console.log('JD File received:', {
                        fieldname,
                        filename: info.filename,
                        mimeType: info.mimeType,
                        bufferLength: fileBuffer.length,
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

        if (!fileBuffer) {
            console.error('No file buffer received');
            return res.status(400).json({
                success: false,
                error: 'No file provided',
            });
        }

        console.log('Processing file with buffer length:', (fileBuffer as Buffer).length);

        // Detect file type and extract text accordingly
        let jdText = '';
        
        // Check file signature (magic bytes) to determine file type
        const signatureBuffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer as any);
        const signature = signatureBuffer.slice(0, 4);
        const signatureHex = signature.toString('hex').toLowerCase();
        
        console.log('File signature detected:', signatureHex);
        
        // DOCX/ZIP signature: 504b0304 (PK..)
        if (signatureHex.startsWith('504b')) {
            console.log('📄 Detected DOCX/ZIP file format');
            const { extractTextFromDOCX } = await import('../app/lib/file-extraction');
            try {
                jdText = extractTextFromDOCX(fileBuffer);
            } catch (docxError) {
                console.error('DOCX extraction error:', docxError);
                throw new Error(`Failed to extract DOCX: ${docxError}`);
            }
        }
        // PDF signature: 25504446 (%PDF)
        else if (signatureHex.startsWith('2550')) {
            console.log('📚 Detected PDF file format');
            const { extractTextFromPDF } = await import('../app/lib/file-extraction');
            try {
                jdText = await extractTextFromPDF(fileBuffer);
            } catch (pdfError) {
                console.error('PDF extraction error:', pdfError);
                throw new Error(`Failed to extract PDF: ${pdfError}`);
            }
        }
        // Image formats (PNG, JPG, etc.)
        else if (signatureHex.startsWith('89') || signatureHex.startsWith('ffd8') || signatureHex.startsWith('474946')) {
            console.log('🖼️ Detected image file format');
            try {
                jdText = await extractTextFromImage(fileBuffer);
            } catch (imgError) {
                console.error('Image extraction error:', imgError);
                throw new Error(`Failed to extract image: ${imgError}`);
            }
        }
        else {
            console.error('Unsupported file format:', signatureHex);
            return res.status(400).json({
                success: false,
                error: `Unsupported file format. Signature: ${signatureHex}. Supported: PDF, DOCX, PNG, JPG, GIF`,
            });
        }

        if (!jdText || jdText.trim().length === 0) {
            console.error('No text extracted from file');
            return res.status(400).json({
                success: false,
                error: 'Failed to extract text from file. File may be empty or corrupted.',
            });
        }

        console.log('Extracted text length:', jdText.length);

        // Parse JD using AI to extract key information
        const extractionPrompt = `You are a job description analyzer. Extract the following information from this Job Description and return ONLY a valid JSON object (no markdown, no extra text):

{
  "jobTitle": "The job title or position name",
  "companyName": "The company name if mentioned, otherwise 'Not specified'",
  "jobDescription": "The full cleaned job description text"
}

JD TEXT:
${jdText}

Return ONLY valid JSON.`;

        try {
            console.log('Calling AI to parse JD...');
            const response = await chat([{
                role: 'user',
                content: extractionPrompt,
            }], {
                temperature: 0.3,
                maxTokens: 2048,
            });

            console.log('AI response received:', response);

            // Extract JSON from response
            const responseText = response.message?.content?.[0]?.text || '';
            console.log('Response text:', responseText);
            
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                console.error('Failed to parse JD response:', responseText);
                // Don't fail - use fallback with extracted text
                return res.status(200).json({
                    success: true,
                    jobTitle: 'Job Description',
                    companyName: 'Not specified',
                    jobDescription: jdText,
                });
            }

            const result = JSON.parse(jsonMatch[0]);

            return res.status(200).json({
                success: true,
                jobTitle: result.jobTitle || 'Not specified',
                companyName: result.companyName || 'Not specified',
                jobDescription: result.jobDescription || jdText,
            });
        } catch (parseError) {
            console.error('JD parsing error:', parseError);
            
            // Fallback: return the extracted text as-is
            return res.status(200).json({
                success: true,
                jobTitle: 'Job Description',
                companyName: 'Not specified',
                jobDescription: jdText,
            });
        }
    } catch (error) {
        console.error('Extract JD error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to extract JD',
        });
    }
}
/**
 * Handle trial usage check and decrement
 * This should be called before any analysis to track free trial usage
 */
async function handleUseTrial(req: VercelRequest, res: VercelResponse, user: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Check if user can use free trial
        const canUse = await canUseFreeTrial(user.id);
        
        if (!canUse) {
            return res.status(403).json({
                success: false,
                error: 'Free trial limit reached (3/3 uses). Please upgrade to continue.',
                trialExhausted: true,
            });
        }

        // Increment trial usage
        const result = await incrementTrialUsage(user.id);

        return res.status(200).json({
            success: true,
            trial: {
                used: result.used,
                remaining: result.remaining,
                max: result.max,
            },
        });
    } catch (error) {
        console.error('Trial usage error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process trial usage',
        });
    }
}

/**
 * Handle trial status check without decrementing
 */
async function handleCheckTrial(req: VercelRequest, res: VercelResponse, user: any) {
    try {
        const canUse = await canUseFreeTrial(user.id);
        
        return res.status(200).json({
            success: true,
            canUseFreeTrial: canUse,
        });
    } catch (error) {
        console.error('Check trial error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check trial status',
        });
    }
}