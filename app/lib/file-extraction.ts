/**
 * Server-side PDF text extraction utility
 * Uses pdfjs-dist to extract text from PDF files
 */

let pdfLib: any = null;

async function loadPdfLib() {
    if (pdfLib) return pdfLib;
    
    try {
        // Import pdfjs for Node.js
        const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfLib = pdfjsModule;
        return pdfLib;
    } catch (error) {
        console.error('Failed to load pdfjs:', error);
        throw new Error('Failed to load PDF processing library');
    }
}

/**
 * Extract text from a PDF buffer
 * @param pdfBuffer - PDF file as Buffer
 * @returns Extracted text from all pages
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
        console.log('📚 Loading PDF library...');
        const pdfjsModule = await loadPdfLib();
        
        console.log('📖 Parsing PDF...');
        const pdf = await pdfjsModule.getDocument({
            data: new Uint8Array(pdfBuffer),
        }).promise;

        console.log(`📄 PDF has ${pdf.numPages} pages`);
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += pageText + '\n';
            } catch (pageError) {
                console.warn(`⚠️ Error extracting text from page ${pageNum}:`, pageError);
                // Continue with next page
            }
        }

        console.log(`✅ Extracted ${fullText.length} characters from PDF`);
        return fullText;
    } catch (error) {
        console.error('❌ PDF extraction error:', error);
        throw new Error(
            `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Extract text from DOCX buffer
 * DOCX is a ZIP file with XML documents inside
 * @param docxBuffer - DOCX file as Buffer
 * @returns Extracted text
 */
export function extractTextFromDOCX(docxBuffer: Buffer): string {
    try {
        console.log('📝 Extracting text from DOCX...');
        
        // Convert buffer to string for XML extraction
        // We need to be careful to only extract actual text content
        let bufferStr: string;
        
        try {
            // Try UTF-8 decoding first
            bufferStr = docxBuffer.toString('utf8');
        } catch {
            // Fallback to latin1 if UTF-8 fails
            bufferStr = docxBuffer.toString('latin1');
        }
        
        // Extract text between <w:t></w:t> XML tags (Word text elements)
        // This is where actual document text is stored
        const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        const textMatches: string[] = [];
        let match;
        
        while ((match = textRegex.exec(bufferStr)) !== null) {
            const textContent = match[1];
            if (textContent && textContent.trim().length > 0) {
                textMatches.push(textContent);
            }
        }

        if (textMatches.length > 0) {
            const extractedText = textMatches.join(' ');
            console.log(`✅ Extracted ${extractedText.length} characters from DOCX (${textMatches.length} text elements)`);
            return extractedText;
        }

        // Fallback: try to extract any printable text
        console.log('⚠️ No XML text elements found, trying alternative extraction...');
        const alternativeText = bufferStr
            .replace(/<[^>]*>/g, '') // Remove all XML tags
            .split(/[\r\n]+/)
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.length < 500) // Filter out unreasonable lines
            .join('\n');

        if (alternativeText.length > 50) {
            console.log(`✅ Extracted ${alternativeText.length} characters from DOCX (alternative)`);
            return alternativeText;
        }

        throw new Error('Could not extract readable text from DOCX file');
    } catch (error) {
        console.error('❌ DOCX extraction error:', error);
        throw new Error(
            `Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

export default { extractTextFromPDF, extractTextFromDOCX };
