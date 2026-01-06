import React, { useState, useEffect } from 'react';
import { useApiStore } from '~/lib/api';

interface ATSOptimizedResumeProps {
    resumeId: string;
    feedback: Feedback;
    resumePath: string;
}

export default function ATSOptimizedResume({ resumeId, feedback, resumePath }: ATSOptimizedResumeProps) {
    const { ai, kv } = useApiStore();
    const [optimizedResume, setOptimizedResume] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTabOpen, setIsTabOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string>('');

    // Check if we already have an optimized resume
    useEffect(() => {
        const loadOptimizedResume = async () => {
            const cached = await kv.get(`resume:${resumeId}:optimized`);
            if (cached) {
                setOptimizedResume(cached);
            }
        };
        loadOptimizedResume();
    }, [resumeId]);

    const generateOptimizedResume = async () => {
        try {
            setIsGenerating(true);
            setError('');

            // Get the original resume text
            const resumeText = await kv.get(`resume:${resumeId}:text`);
            if (!resumeText) {
                throw new Error('Resume text not found. Please re-analyze your resume.');
            }

            // Get job description if available
            const resumeData = await kv.get(`resume:${resumeId}`);
            const data = resumeData ? JSON.parse(resumeData) : {};
            const jobDescription = data.jobDescription || '';

            // Generate optimized resume using AI
            const optimized = await ai.rebuildResume(resumeText, feedback, jobDescription);
            
            if (!optimized) {
                throw new Error('Failed to generate optimized resume');
            }

            // Cache the optimized resume
            await kv.set(`resume:${resumeId}:optimized`, optimized);
            setOptimizedResume(optimized);
            setIsExpanded(true);
        } catch (err: any) {
            console.error('Error generating optimized resume:', err);
            setError(err.message || 'Failed to generate optimized resume');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(optimizedResume);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([optimizedResume], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized-resume.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsTabOpen(!isTabOpen)}
                className="w-full p-6 flex items-start justify-between hover:bg-gray-50 transition"
            >
                <div className="flex items-start gap-3 text-left">
                    <div className="p-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-black">Resume Generation</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {optimizedResume ? 'AI-rebuilt resume ready to use' : 'Generate optimized resume with all suggestions applied'}
                        </p>
                    </div>
                </div>
                <svg
                    className={`w-6 h-6 text-gray-400 flex-shrink-0 transition-transform ${isTabOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Collapsible Content */}
            {isTabOpen && (
                <div className="border-t border-gray-200 p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Content */}
                    {!optimizedResume ? (
                        <div className="text-center py-8">
                            <div className="mb-4">
                                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">Generate Your Optimized Resume</h4>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Click below to have AI rebuild your resume with all improvement suggestions applied.
                            </p>
                            <button
                                onClick={generateOptimizedResume}
                                disabled={isGenerating}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        Generating...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Generate Optimized Resume
                                    </span>
                                )}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Action Buttons */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                                >
                                    {copied ? (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy to Clipboard
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </button>
                                <button
                                    onClick={generateOptimizedResume}
                                    disabled={isGenerating}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Regenerate
                                </button>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="ml-auto flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    {isExpanded ? 'Collapse' : 'Expand'}
                                    <svg 
                                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Resume Content */}
                            {isExpanded && (
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-[600px] overflow-y-auto">
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                                        {optimizedResume}
                                    </pre>
                                </div>
                            )}

                            {!isExpanded && (
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">Optimized resume ready! Click expand to view or copy directly.</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
