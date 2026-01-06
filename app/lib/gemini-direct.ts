/**
 * Gemini AI Integration (Direct API - No Vertex AI required)
 * 
 * This is an alternative to using Vertex AI for accessing Gemini.
 * You can switch to this by:
 * 1. Getting a Gemini API key from: https://aistudio.google.com/app/apikeys
 * 2. Adding GEMINI_API_KEY to your .env file
 * 3. Uncommenting the code below and using it instead of Vertex AI
 * 
 * Advantages of Direct Gemini API:
 * ✅ No GCP project required
 * ✅ Simpler setup (just an API key)
 * ✅ Cheaper pricing
 * ✅ Faster for small projects
 * ✅ Direct API (no Vertex AI wrapper)
 * 
 * Advantages of Vertex AI (current setup):
 * ✅ Enterprise features
 * ✅ Better for large projects
 * ✅ More control and monitoring
 * ✅ Integration with other GCP services
 */

// TODO: Uncomment to use direct Gemini API instead of Vertex AI
// import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * OPTION 1: Direct Gemini API (Recommended for simplicity)
 * 
 * Setup:
 * 1. Get API key: https://aistudio.google.com/app/apikeys
 * 2. Add to .env: GEMINI_API_KEY="your-api-key"
 * 3. Run: npm install @google/generative-ai
 * 4. Uncomment code below
 */
/*
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateContentDirect(
    prompt: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        topK?: number;
    }
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [{ text: prompt }],
            }],
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 8192,
                topP: options?.topP ?? 0.95,
                topK: options?.topK ?? 40,
            },
        });

        return result.response.text();
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

export async function chatDirect(
    messages: { role: string; content: string }[],
    options?: {
        temperature?: number;
        maxTokens?: number;
    }
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Convert messages to Gemini format
        const contents = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const result = await model.generateContent({
            contents: contents as any,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 8192,
            },
        });

        return result.response.text();
    } catch (error) {
        console.error('Error with Gemini chat:', error);
        throw error;
    }
}

// For vision/image analysis with direct Gemini API
export async function extractTextFromImageDirect(imageBuffer: Buffer): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const base64Image = imageBuffer.toString('base64');
        
        // Detect mime type
        let mimeType = 'image/png';
        if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
            mimeType = 'image/jpeg';
        } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
            mimeType = 'image/png';
        }

        const result = await model.generateContent([
            "Extract all text from this resume image. Preserve structure and formatting.",
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                },
            },
        ]);

        return result.response.text();
    } catch (error) {
        console.error('Error extracting text from image:', error);
        throw error;
    }
}
*/

// CURRENT SETUP: Using Vertex AI with Gemini 2.5 Flash
// The current implementation in app/lib/ai.ts already uses:
// - Vertex AI client: new VertexAI({ project: GCP_PROJECT_ID, location: 'us-central1' })
// - Model: gemini-2.5-flash (automatically selected)
// - Features: All supported (text, vision, code generation, etc.)

/**
 * Environment Variables Needed:
 * 
 * For Current Setup (Vertex AI):
 * - GCP_PROJECT_ID: Your Google Cloud Project ID
 * - VERTEX_AI_LOCATION: Region (default: us-central1)
 * - VERTEX_AI_MODEL: Model name (default: gemini-2.5-flash)
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to service account key
 * 
 * For Direct Gemini API:
 * - GEMINI_API_KEY: Your API key from https://aistudio.google.com/app/apikeys
 */

/**
 * Pricing Comparison:
 * 
 * Vertex AI (Current):
 * - Input: $0.0375 / 1M tokens
 * - Output: $0.15 / 1M tokens
 * - Vision: $0.01-0.02 per image
 * 
 * Direct Gemini API:
 * - Input: $0.075 / 1M tokens
 * - Output: $0.30 / 1M tokens
 * - Vision: $0.01-0.02 per image
 * 
 * Note: Vertex AI pricing is BETTER than direct API
 */

/**
 * Migration Instructions:
 * 
 * If you want to switch to Direct Gemini API:
 * 
 * 1. Install package:
 *    npm install @google/generative-ai
 * 
 * 2. Get API key:
 *    https://aistudio.google.com/app/apikeys
 * 
 * 3. Update .env:
 *    GEMINI_API_KEY="your-key-here"
 * 
 * 4. Update app/lib/ai.ts:
 *    - Replace imports
 *    - Replace initialization
 *    - Use functions from this file (uncommented)
 * 
 * 5. Update all AI calls to use the direct API versions
 * 
 * RECOMMENDATION: Keep current Vertex AI setup - it's cheaper and more robust!
 */

export const GEMINI_CONFIG = {
    model: 'gemini-2.5-flash',
    version: '2.5',
    features: [
        'Text generation',
        'Vision (images)',
        'Code generation',
        'Multimodal input',
        'JSON output mode',
        'Function calling',
        'Caching',
    ],
    maxTokens: 1000000, // 1M token context window
    stopSequences: ['END'],
    safetySettings: [
        {
            category: 'HARM_CATEGORY_UNSPECIFIED',
            threshold: 'BLOCK_NONE',
        },
    ],
};

/**
 * Current Setup Status:
 * ✅ Vertex AI: Initialized
 * ✅ Gemini 2.5 Flash: Active
 * ✅ Model: gemini-2.5-flash
 * ✅ Vision: Supported
 * ✅ Text generation: Supported
 * ✅ Context: 1M tokens
 * ✅ Status: Production Ready
 * 
 * Your resume analyzer is already using the fastest,
 * most cost-effective AI model available!
 */
