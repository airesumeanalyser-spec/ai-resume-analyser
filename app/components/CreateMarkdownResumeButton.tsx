import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApiStore } from '~/lib/api';

interface CreateMarkdownResumeButtonProps {
    resumePath: string;
    resumeId: string;
}

export default function CreateMarkdownResumeButton({ resumePath, resumeId }: CreateMarkdownResumeButtonProps) {
    const { ai, fs, kv } = useApiStore();
    const navigate = useNavigate();
    const [isConverting, setIsConverting] = useState(false);

    const handleCreateMarkdown = async () => {
        try {
            setIsConverting(true);

            // Read the original resume file
            const resumeBlob = await fs.read(resumePath);
            if (!resumeBlob) {
                alert('Failed to read resume file');
                return;
            }

            // Convert blob to text (for PDF, we'd need to extract text - for now assume it's text or we have the extracted text)
            // Check if we have the extracted text stored
            const resumeData = await kv.get(`resume:${resumeId}`);
            if (!resumeData) {
                alert('Resume data not found');
                return;
            }

            const data = JSON.parse(resumeData);
            
            // We need the extracted text from the analysis
            // This should be available from the img2txt step
            const extractedTextKey = `resume:${resumeId}:text`;
            let resumeText = await kv.get(extractedTextKey);
            
            if (!resumeText) {
                // Try to extract from the image again if not stored
                alert('Resume text not available. Please try re-analyzing your resume.');
                return;
            }

            // Convert to markdown
            console.log('Converting resume to markdown...');
            const markdown = await ai.convertToMarkdown(resumeText);
            
            if (!markdown) {
                alert('Failed to convert resume to markdown');
                return;
            }

            // Store the markdown
            const markdownId = `resume:${resumeId}:markdown`;
            await kv.set(markdownId, markdown);

            // Navigate to editor with the markdown
            navigate(`/editor/${resumeId}?source=analysis`);
        } catch (error) {
            console.error('Error creating markdown resume:', error);
            alert('Failed to create markdown resume. Please try again.');
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <button
            onClick={handleCreateMarkdown}
            disabled={isConverting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Convert your resume to an editable markdown format"
        >
            <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                />
            </svg>
            {isConverting ? (
                <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Converting...
                </span>
            ) : (
                'Create Markdown Resume'
            )}
        </button>
    );
}
