/**
 * PDF Export Utility
 * Generate high-quality PDFs from markdown resumes
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ParsedResume } from './resume-parser';

export interface PDFExportOptions {
    format?: 'a4' | 'letter';
    margin?: number;
    filename?: string;
    scale?: number;
    quality?: number;
}

/**
 * Generate PDF from parsed resume
 */
export async function generatePDF(
    parsedResume: ParsedResume,
    options: PDFExportOptions = {}
): Promise<Blob> {
    const {
        format = 'a4',
        margin = 20,
        filename = 'resume.pdf',
        scale = 2,
        quality = 0.95,
    } = options;

    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = format === 'a4' ? '210mm' : '8.5in';
    container.style.background = 'white';
    container.style.padding = `${margin}px`;
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // Build the HTML content
    container.innerHTML = buildResumeHTML(parsedResume);
    
    // Append to body temporarily
    document.body.appendChild(container);

    try {
        // Render to canvas
        const canvas = await html2canvas(container, {
            scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        // Calculate PDF dimensions
        const imgWidth = format === 'a4' ? 210 : 215.9; // mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Create PDF
        const pdf = new jsPDF({
            orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
            unit: 'mm',
            format,
        });

        const imgData = canvas.toDataURL('image/jpeg', quality);
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

        // Return as blob
        return pdf.output('blob');
    } finally {
        // Clean up
        document.body.removeChild(container);
    }
}

/**
 * Download PDF file
 */
export async function downloadPDF(
    parsedResume: ParsedResume,
    options: PDFExportOptions = {}
): Promise<void> {
    const filename = options.filename || 'resume.pdf';
    const blob = await generatePDF(parsedResume, options);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
}

/**
 * Build HTML for resume rendering
 */
function buildResumeHTML(parsedResume: ParsedResume): string {
    const { frontMatter, html } = parsedResume;
    const themeColor = frontMatter.themeColor || '#2563eb';

    return `
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #1f2937;
            }
            
            .resume-header {
                text-align: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 2px solid ${themeColor};
            }
            
            .resume-name {
                font-size: 28pt;
                font-weight: bold;
                color: #111827;
                margin-bottom: 8px;
            }
            
            .resume-contact {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 12px;
                font-size: 9pt;
                color: #4b5563;
            }
            
            .resume-contact-item {
                color: ${themeColor};
                text-decoration: none;
            }
            
            .resume-content {
                max-width: 100%;
            }
            
            h2 {
                font-size: 14pt;
                font-weight: bold;
                color: ${themeColor};
                margin-top: 20px;
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 1px solid #e5e7eb;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            h3 {
                font-size: 12pt;
                font-weight: bold;
                color: #111827;
                margin-top: 12px;
                margin-bottom: 4px;
            }
            
            p {
                margin-bottom: 8px;
                text-align: justify;
            }
            
            strong {
                font-weight: 600;
                color: #111827;
            }
            
            em {
                font-style: italic;
                color: #6b7280;
            }
            
            ul {
                margin-left: 20px;
                margin-bottom: 12px;
            }
            
            li {
                margin-bottom: 4px;
                line-height: 1.6;
            }
            
            a {
                color: ${themeColor};
                text-decoration: none;
            }
            
            code {
                background-color: #f3f4f6;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 9pt;
                font-family: 'Courier New', monospace;
            }
            
            /* Prevent page breaks inside elements */
            h2, h3, p, li {
                page-break-inside: avoid;
            }
            
            /* Keep headers with their content */
            h2, h3 {
                page-break-after: avoid;
            }
        </style>
        
        ${frontMatter.name ? `
            <div class="resume-header">
                <div class="resume-name">${frontMatter.name}</div>
                ${frontMatter.header ? `
                    <div class="resume-contact">
                        ${frontMatter.header.map(item => {
                            if (item.link) {
                                return `<a href="${item.link}" class="resume-contact-item">${item.text}</a>`;
                            }
                            return `<span class="resume-contact-item">${item.text}</span>`;
                        }).join(' <span style="color: #9ca3af;">|</span> ')}
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="resume-content">
            ${html}
        </div>
    `;
}

/**
 * Generate PDF preview URL (for iframe)
 */
export async function generatePDFPreviewURL(
    parsedResume: ParsedResume,
    options: PDFExportOptions = {}
): Promise<string> {
    const blob = await generatePDF(parsedResume, options);
    return URL.createObjectURL(blob);
}

/**
 * Print-to-PDF using browser's native print dialog
 */
export function printToPDF(parsedResume: ParsedResume): void {
    // Create a new window with the resume content
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        alert('Please allow popups to print resume');
        return;
    }

    const html = buildResumeHTML(parsedResume);
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${parsedResume.frontMatter.name || 'Resume'} - Resume</title>
            <style>
                @page {
                    size: A4;
                    margin: 0.75in;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        // Don't close automatically - let user see preview
        // printWindow.close();
    }, 500);
}

/**
 * Export options for different resume formats
 */
export const PDF_PRESETS = {
    standard: {
        format: 'a4' as const,
        margin: 20,
        scale: 2,
        quality: 0.95,
    },
    highQuality: {
        format: 'a4' as const,
        margin: 20,
        scale: 3,
        quality: 1.0,
    },
    usLetter: {
        format: 'letter' as const,
        margin: 20,
        scale: 2,
        quality: 0.95,
    },
    compact: {
        format: 'a4' as const,
        margin: 15,
        scale: 2,
        quality: 0.9,
    },
} as const;
