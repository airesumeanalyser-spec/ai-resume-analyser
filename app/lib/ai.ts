import { VertexAI } from '@google-cloud/vertexai';
import { readFile } from './storage';

// Environment variables
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || '';
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const VERTEX_AI_MODEL = process.env.VERTEX_AI_MODEL || 'gemini-2.5-flash';

// Initialize Vertex AI
let vertexAI: VertexAI | null = null;

try {
    if (GCP_PROJECT_ID) {
        vertexAI = new VertexAI({
            project: GCP_PROJECT_ID,
            location: VERTEX_AI_LOCATION,
        });
        console.log('✅ Vertex AI initialized');
    } else {
        console.warn('⚠️ GCP_PROJECT_ID not set. AI features will not work.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Vertex AI:', error);
}

/**
 * AI Response interface
 */
export interface AIResponse {
    index: number;
    message: {
        role: string;
        content: string | any[];
        refusal: null | string;
        annotations: any[];
    };
    logprobs: null | any;
    finish_reason: string;
    usage: {
        type: string;
        model: string;
        amount: number;
        cost: number;
    }[];
    via_ai_chat_service: boolean;
}

/**
 * Resume analysis result interface
 */
export interface ResumeAnalysis {
    ats_score: number;
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    improvements: {
        category: string;
        issue: string;
        suggestion: string;
        priority: 'high' | 'medium' | 'low';
    }[];
    sections: {
        name: string;
        score: number;
        feedback: string;
    }[];
    keywords: {
        present: string[];
        missing: string[];
        suggestions: string[];
    };
    summary: string;
}

/**
 * Chat message interface
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | { type: string; text?: string; puter_path?: string }[];
}

/**
 * Generate content using Vertex AI
 */
export async function generateContent(
    prompt: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        topK?: number;
    }
): Promise<string> {
    if (!vertexAI) {
        throw new Error('Vertex AI not initialized');
    }

    const generativeModel = vertexAI.getGenerativeModel({
        model: VERTEX_AI_MODEL,
        generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 16384, // Increased for longer resume analysis outputs
            topP: options?.topP ?? 0.95,
            topK: options?.topK ?? 40,
        },
    });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Chat with AI (supports conversation history)
 */
export async function chat(
    messages: ChatMessage[],
    options?: {
        temperature?: number;
        maxTokens?: number;
    }
): Promise<AIResponse> {
    if (!vertexAI) {
        throw new Error('Vertex AI not initialized');
    }

    // Convert messages to Vertex AI format
    const prompt = messages
        .map((msg) => {
            if (typeof msg.content === 'string') {
                return `${msg.role}: ${msg.content}`;
            }
            // Handle complex content (files, etc.)
            return `${msg.role}: ${JSON.stringify(msg.content)}`;
        })
        .join('\n\n');

    const content = await generateContent(prompt, options);

    // Format response to match expected structure
    return {
        index: 0,
        message: {
            role: 'assistant',
            content: content,
            refusal: null,
            annotations: [],
        },
        logprobs: null,
        finish_reason: 'stop',
        usage: [
            {
                type: 'tokens',
                model: VERTEX_AI_MODEL,
                amount: content.length / 4, // Rough estimate
                cost: 0,
            },
        ],
        via_ai_chat_service: true,
    };
}

/**
 * Analyze resume text and provide comprehensive feedback
 */
export async function analyzeResume(
    resumeText: string,
    jobDescription?: string
): Promise<ResumeAnalysis> {
    // Import prompt builder dynamically to avoid circular dependencies
    const { buildAnalysisPrompt } = await import('../../constants/prompts');
    const prompt = buildAnalysisPrompt(resumeText, jobDescription || '');

    const response = await generateContent(prompt, {
        temperature: 0.3, // Lower temperature for consistent structured output
        maxTokens: 8192, // Significantly increased to accommodate full analysis
    });

    // Parse JSON response
    try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
    } catch (error) {
        console.error('Failed to parse AI response:', error);
        throw new Error('Failed to analyze resume. Please try again.');
    }
}

/**
 * Generate improvement suggestions for specific resume section
 */
export async function generateFeedback(
    resumeText: string,
    section: string,
    specificQuestion?: string
): Promise<string> {
    const { buildFeedbackPrompt } = await import('../../constants/prompts');
    const prompt = buildFeedbackPrompt(resumeText, section, specificQuestion);

    return await generateContent(prompt, {
        temperature: 0.7,
        maxTokens: 8192,  // Increased to maximum to prevent truncation
    });
}

/**
 * Extract text from image (OCR)
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    if (!vertexAI) {
        console.error('Vertex AI not initialized. GCP_PROJECT_ID:', GCP_PROJECT_ID);
        throw new Error('Vertex AI not initialized - check GCP_PROJECT_ID environment variable');
    }

    try {
        // Validate buffer
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('Empty image buffer provided');
        }

        // Use gemini-2.5-flash for vision tasks with multimodal support
        const generativeModel = vertexAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
        });

        // Detect mime type from image buffer signature
        let mimeType = 'image/png'; // Default to PNG
        const signature = imageBuffer.subarray(0, 4);
        
        if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
            mimeType = 'image/jpeg';
        } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
            mimeType = 'image/png';
        } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
            mimeType = 'image/gif';
        } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46 && imageBuffer[3] === 0x46) {
            mimeType = 'image/webp';
        } else {
            console.warn('Unknown image format, signature:', signature.toString('hex'));
            // Try to detect from common patterns
            if (imageBuffer.includes(Buffer.from('PNG'))) {
                mimeType = 'image/png';
            } else if (imageBuffer.includes(Buffer.from('JFIF'))) {
                mimeType = 'image/jpeg';
            }
        }

        console.log('Extracting text from image:', {
            bufferSize: imageBuffer.length,
            mimeType,
            signatureHex: signature.toString('hex'),
            firstBytes: imageBuffer.subarray(0, 16).toString('hex'),
        });

        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');

        console.log('Base64 conversion:', {
            base64Length: base64Image.length,
            base64Preview: base64Image.substring(0, 50),
        });

        const result = await generativeModel.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: 'Extract all text from this resume image. Preserve the structure and formatting as much as possible. Return only the extracted text, no additional commentary.' },
                    { inlineData: { mimeType: mimeType, data: base64Image } },
                ],
            }],
        });

        const response = result.response;
        const extractedText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        console.log('Text extraction successful:', {
            textLength: extractedText.length,
            preview: extractedText.substring(0, 100),
        });

        return extractedText;
    } catch (error) {
        console.error('Error in extractTextFromImage:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to extract text from image: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Extract text from resume file path
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
    try {
        console.log('📂 Attempting to extract text from file:', filePath);
        
        // Read file from GCS
        console.log('📥 Reading file from GCS...');
        const fileBuffer = await readFile(filePath);
        console.log(`✅ File read successfully. Size: ${fileBuffer.length} bytes`);

        // Determine file type from path
        const extension = filePath.split('.').pop()?.toLowerCase();
        console.log(`📄 File extension: ${extension}`);

        if (extension === 'pdf') {
            // For PDF, use image extraction (convert to image first or use different method)
            // This is simplified - in production, use pdf parsing library
            console.log('📖 Processing as PDF...');
            return await extractTextFromImage(fileBuffer);
        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
            // Image file
            console.log('🖼️ Processing as image...');
            return await extractTextFromImage(fileBuffer);
        } else {
            throw new Error(`Unsupported file type: ${extension}`);
        }
    } catch (error) {
        console.error('❌ Failed to extract text from file:', error);
        console.error('❌ File path was:', filePath);
        
        // Provide more specific error message
        if (error instanceof Error) {
            if (error.message.includes('File not found')) {
                throw new Error(`File not found at path: ${filePath}`);
            } else if (error.message.includes('not initialized')) {
                throw new Error('GCS bucket not initialized - check environment variables');
            }
        }
        
        throw new Error(`Failed to extract text from resume file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate ATS-optimized keywords for a job description
 */
export async function generateKeywordSuggestions(
    resumeText: string,
    jobDescription: string
): Promise<string[]> {
    const { buildKeywordPrompt } = await import('../../constants/prompts');
    const prompt = buildKeywordPrompt(resumeText, jobDescription);

    const response = await generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 500,
    });

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No array found in response');
        }
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Failed to parse keyword suggestions:', error);
        return [];
    }
}

/**
 * Generate a professional summary based on resume content
 */
export async function generateProfessionalSummary(
    resumeText: string,
    targetRole?: string
): Promise<string> {
    const { buildSummaryPrompt } = await import('../../constants/prompts');
    const prompt = buildSummaryPrompt(resumeText, targetRole);

    return await generateContent(prompt, {
        temperature: 0.8,
        maxTokens: 200,
    });
}

/**
 * Inline suggestion interface
 */
export interface InlineSuggestion {
    id: string;
    line: number;
    column: number;
    length: number;
    severity: 'error' | 'warning' | 'info';
    category: 'ats' | 'content' | 'formatting' | 'grammar';
    message: string;
    suggestion: string;
    originalText?: string;
}

/**
 * Get inline suggestions for resume editing
 */
export async function getInlineSuggestions(
    resumeText: string,
    jobDescription?: string
): Promise<InlineSuggestion[]> {
    const { buildInlineSuggestionsPrompt } = await import('../../constants/prompts');
    const prompt = buildInlineSuggestionsPrompt(resumeText, jobDescription);

    const response = await generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 2000,
    });

    try {
        // Try to extract JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('No JSON array found in AI response');
            return [];
        }

        const suggestions = JSON.parse(jsonMatch[0]);

        // Validate and ensure each suggestion has required fields
        return suggestions.filter((s: any) => {
            return (
                s.id &&
                typeof s.line === 'number' &&
                typeof s.column === 'number' &&
                s.severity &&
                s.category &&
                s.message &&
                s.suggestion
            );
        }).map((s: any, index: number) => ({
            id: s.id || `suggestion-${index}`,
            line: s.line,
            column: s.column,
            length: s.length || s.suggestion.length,
            severity: s.severity,
            category: s.category,
            message: s.message,
            suggestion: s.suggestion,
            originalText: s.originalText,
        }));
    } catch (error) {
        console.error('Failed to parse inline suggestions:', error);
        return [];
    }
}

/**
 * Check if Vertex AI is available
 */
export function isAIAvailable(): boolean {
    return vertexAI !== null && !!GCP_PROJECT_ID;
}

/**
 * Convert resume text to markdown format suitable for the editor
 */
export async function convertResumeToMarkdown(resumeText: string): Promise<string> {
    if (!vertexAI) {
        throw new Error('Vertex AI not initialized');
    }

    const prompt = `Convert the following resume text into a clean, well-structured Markdown format suitable for a resume editor.

RESUME TEXT:
${resumeText}

REQUIREMENTS:
1. Extract and organize all information into proper sections
2. Use standard resume section headers (## Experience, ## Education, etc.)
3. Format dates consistently as *Month Year - Month Year* or *Month Year - Present*
4. Use bullet points (- ) for achievements and responsibilities
5. Bold job titles and company names using **text**
6. Include a YAML frontmatter section at the top with:
   - name
   - email
   - phone
   - location (if available)
   - linkedin (if available)
   - github (if available)
7. Use proper markdown syntax throughout
8. Preserve all quantifiable achievements and metrics
9. Maintain professional formatting and spacing

OUTPUT FORMAT:
Return ONLY the markdown content, no explanations or additional text.

Example structure:
---
name: John Doe
email: john@example.com
phone: (555) 123-4567
location: San Francisco, CA
linkedin: linkedin.com/in/johndoe
---

## Summary
Brief professional summary...

## Experience
**Software Engineer** | *Company Name* | *Jan 2020 - Present*
- Achievement with metrics
- Another responsibility

## Education
**Degree** | *University* | *Year*

## Skills
- Technical skills
- Tools and technologies

Begin conversion:`;

    const markdown = await generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 2000,
    });

    // Clean up any potential markdown code fences from the response
    let cleaned = markdown.trim();
    cleaned = cleaned.replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```\s*$/i, '');
    
    return cleaned;
}

/**
 * Rebuild resume with all AI suggestions applied
 */
export async function rebuildResume(
    resumeText: string,
    feedback: any,
    jobDescription?: string
): Promise<string> {
    const { buildResumeRebuildPrompt } = await import('../../constants/prompts');
    const prompt = buildResumeRebuildPrompt(resumeText, feedback, jobDescription);

    const rebuiltResume = await generateContent(prompt, {
        temperature: 0.4, // Slightly higher for more creative improvements
        maxTokens: 10000, // Increased significantly for complete resume generation
    });

    // Clean up the response
    let cleaned = rebuiltResume.trim();
    
    // Remove any markdown code blocks
    cleaned = cleaned.replace(/^```(?:text|plain|markdown)?\s*/i, '').replace(/\s*```\s*$/i, '');
    
    // Ensure proper spacing between sections
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
}
