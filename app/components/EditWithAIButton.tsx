import { useState } from 'react';
import { useNavigate } from 'react-router';

interface EditWithAIButtonProps {
    resumeId: string;
    feedback: any; // AI analysis results
    resumePath: string;
    imagePath?: string; // Optional: path to the resume image for OCR
}

export default function EditWithAIButton({ resumeId, feedback, resumePath, imagePath }: EditWithAIButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    async function handleEditWithAI() {
        setIsLoading(true);
        try {
            // First, try to read existing markdown resume
            let markdown = '';
            try {
                const readResponse = await fetch(`/api/files?action=read&path=${resumePath.replace('.pdf', '.md')}`);
                if (readResponse.ok) {
                    const readData = await readResponse.json();
                    markdown = readData.content || '';
                }
            } catch (error) {
                console.log('No existing markdown resume found, will create new');
            }

            // If no markdown exists, extract from PDF or create template
            if (!markdown && imagePath) {
                // Try OCR extraction using the actual image path
                try {
                    console.log('🔍 Attempting OCR with image path:', imagePath);
                    const ocrResponse = await fetch('/api/ai?action=img2txt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            filePath: imagePath, // Use the actual stored image path
                        }),
                    });

                    if (ocrResponse.ok) {
                        const ocrData = await ocrResponse.json();
                        markdown = convertToMarkdown(ocrData.text);
                    } else {
                        console.error('OCR API returned error:', await ocrResponse.text());
                    }
                } catch (error) {
                    console.error('OCR failed:', error);
                }
            }

            // If still no markdown, use default template
            if (!markdown) {
                const { getDefaultResumeTemplate } = await import('../lib/resume-parser');
                markdown = getDefaultResumeTemplate();
            }

            // Apply AI suggestions
            const applyResponse = await fetch('/api/ai?action=apply-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    markdown,
                    analysis: feedback,
                }),
            });

            if (applyResponse.ok) {
                const applyData = await applyResponse.json();
                
                // Save the updated markdown
                const saveResponse = await fetch('/api/files?action=write', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: `resumes/${resumeId}.md`,
                        content: applyData.updatedMarkdown,
                    }),
                });

                if (saveResponse.ok) {
                    // Navigate to editor
                    navigate(`/editor/${resumeId}`);
                } else {
                    alert('Failed to save resume');
                }
            } else {
                alert('Failed to apply AI suggestions');
            }
        } catch (error) {
            console.error('Error applying AI suggestions:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    // Simple text to markdown converter
    function convertToMarkdown(text: string): string {
        // This is a basic implementation - can be improved
        const lines = text.split('\n');
        let markdown = '---\nname: Your Name\n---\n\n';
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Detect headers (all caps or specific keywords)
            if (trimmed === trimmed.toUpperCase() && trimmed.length < 50) {
                markdown += `\n## ${trimmed}\n\n`;
            } else if (trimmed.match(/^(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|SUMMARY)/i)) {
                markdown += `\n## ${trimmed}\n\n`;
            } else {
                markdown += `${trimmed}\n\n`;
            }
        }
        
        return markdown;
    }

    return (
        <button
            onClick={handleEditWithAI}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Applying AI Suggestions...</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit with AI Suggestions</span>
                </>
            )}
        </button>
    );
}
