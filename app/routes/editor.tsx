import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useApiStore } from "~/lib/api";
import { parseResume, parseFrontMatter } from "~/lib/resume-parser";
import { resumeTemplates, getTemplate } from "~/lib/resume-templates";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

export const meta = () => ([
    { title: 'StackResume.ai | Resume Editor' },
    { name: 'description', content: 'Create beautiful resumes with our markdown editor' }
]);

const Editor = () => {
    const { auth, isLoading, fs, kv } = useApiStore();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Editor state
    const [markdown, setMarkdown] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('professional');
    const [showTemplates, setShowTemplates] = useState(false);
    const [showTips, setShowTips] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [resumeName, setResumeName] = useState('');
    const [showPreview, setShowPreview] = useState(true);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Parse the markdown for preview
    const parsedResume = parseResume(markdown);
    const { frontMatter } = parseFrontMatter(markdown);
    const themeColor = frontMatter.themeColor || '#2563eb';

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleManualSave();
            }
            // Cmd/Ctrl + P to toggle preview
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault();
                setShowPreview(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [markdown]);

    // Load resume if editing existing one
    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate(`/auth?next=/editor/${id || 'new'}`);
        }
    }, [isLoading, auth.isAuthenticated]);

    useEffect(() => {
        const loadResume = async () => {
            // Check if coming from a converted resume
            const convertedContent = searchParams.get('content');
            if (convertedContent) {
                try {
                    setMarkdown(decodeURIComponent(convertedContent));
                    return;
                } catch (e) {
                    console.error('Failed to decode content', e);
                }
            }

            if (id && id !== 'new') {
                // Load existing resume from KV store
                try {
                    const data = await kv.get(`resume-md:${id}`);
                    if (data) {
                        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                        setMarkdown(parsed.markdown || '');
                        setResumeName(parsed.name || '');
                        setSelectedTemplate(parsed.template || 'professional');
                    }
                } catch (e) {
                    console.error('Failed to load resume', e);
                }
            } else {
                // New resume - load default template
                const template = getTemplate(selectedTemplate);
                if (template) {
                    setMarkdown(template.markdown);
                }
            }
        };

        if (auth.isAuthenticated) {
            loadResume();
        }
    }, [id, auth.isAuthenticated]);

    // Auto-save functionality
    const saveResume = useCallback(async (content: string, silent = false) => {
        if (!auth.isAuthenticated || !content) return;

        if (!silent) setIsSaving(true);

        try {
            const resumeId = id === 'new' ? `resume-${Date.now()}` : id;
            const data = {
                id: resumeId,
                markdown: content,
                name: resumeName || frontMatter.name || 'Untitled Resume',
                template: selectedTemplate,
                updatedAt: new Date().toISOString(),
            };

            await kv.set(`resume-md:${resumeId}`, JSON.stringify(data));
            setLastSaved(new Date());

            // Update URL if creating new resume
            if (id === 'new') {
                window.history.replaceState({}, '', `/editor/${resumeId}`);
            }
        } catch (e) {
            console.error('Failed to save resume', e);
        } finally {
            if (!silent) setIsSaving(false);
        }
    }, [auth.isAuthenticated, id, resumeName, frontMatter, selectedTemplate, kv]);

    // Debounced auto-save
    useEffect(() => {
        if (!markdown) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveResume(markdown, true);
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [markdown, saveResume]);

    const handleTemplateSelect = (templateId: string) => {
        const template = getTemplate(templateId);
        if (template) {
            setMarkdown(template.markdown);
            setSelectedTemplate(templateId);
            setShowTemplates(false);
        }
    };

    const handleManualSave = () => {
        saveResume(markdown, false);
    };

    const handleExport = async () => {
        // TODO: Implement PDF export
        alert('PDF export coming soon!');
    };

    const insertText = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = markdown.substring(0, start) + text + markdown.substring(end);
        
        setMarkdown(newText);
        
        // Set cursor position after inserted text
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    };

    const markdownTips = [
        { label: 'Bold', syntax: '**text**', description: 'Make text bold', icon: 'B' },
        { label: 'Italic', syntax: '*text*', description: 'Italicize text', icon: 'I' },
        { label: 'Heading', syntax: '## Heading', description: 'Create a section', icon: 'H2' },
        { label: 'Link', syntax: '[text](url)', description: 'Add a hyperlink', icon: '🔗' },
        { label: 'List', syntax: '- item', description: 'Create bullet points', icon: '•' },
    ];

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-4 gap-4">
                {/* Header Bar */}
                <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="back-button">
                            <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5"/>
                            <span className="text-gray-800 text-sm font-semibold max-sm:hidden">Back</span>
                        </Link>
                        <div className="flex flex-col">
                            <h2 className="!text-black text-xl font-bold">Resume Editor</h2>
                            <p className="text-sm text-gray-500">
                                {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all max-sm:px-2 max-sm:text-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                            </svg>
                            <span className="max-sm:hidden">Templates</span>
                        </button>

                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all lg:hidden"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                        </button>

                        <button
                            onClick={handleManualSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 max-sm:px-2"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="max-sm:hidden">Saving...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    <span className="max-sm:hidden">Save</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 primary-gradient text-white rounded-lg hover:primary-gradient-hover transition-all max-sm:px-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="max-sm:hidden">Export PDF</span>
                        </button>
                    </div>
                </div>

                {/* Template Selector Modal */}
                {showTemplates && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-backdrop">
                        <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto modal-content shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-black">Choose a Template</h3>
                                    <p className="text-sm text-gray-500 mt-1">Select a professional template to get started</p>
                                </div>
                                <button
                                    onClick={() => setShowTemplates(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                                    aria-label="Close"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resumeTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template.id)}
                                        className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {template.name[0]}
                                                </div>
                                                <h4 className="text-lg font-semibold text-black">{template.name}</h4>
                                            </div>
                                            {selectedTemplate === template.id && (
                                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                                        <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                                            template.category === 'professional' ? 'bg-blue-100 text-blue-800' :
                                            template.category === 'technical' ? 'bg-green-100 text-green-800' :
                                            template.category === 'creative' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {template.category}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Editor Area */}
                <div className="flex-1 flex gap-4 min-h-0 max-lg:flex-col">
                    {/* Editor Panel */}
                    <div className={`flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden ${showPreview ? 'lg:w-1/2' : 'w-full'} max-lg:${showPreview ? 'hidden' : 'flex'}`}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <h3 className="font-semibold text-black">Markdown Editor</h3>
                            </div>
                            <button
                                onClick={() => setShowTips(!showTips)}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {showTips ? 'Hide' : 'Show'} Tips
                            </button>
                        </div>

                        {showTips && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                                <div className="flex flex-wrap gap-2">
                                    {markdownTips.map((tip) => (
                                        <button
                                            key={tip.label}
                                            onClick={() => insertText(tip.syntax)}
                                            className="markdown-tip-button group relative"
                                            title={tip.description}
                                        >
                                            <span className="font-semibold text-xs mr-1.5 text-gray-700">{tip.icon}</span>
                                            <span className="font-mono text-xs text-gray-600">{tip.syntax}</span>
                                            <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                                {tip.description}
                                                <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-2">💡 Click any syntax to insert it at cursor position</p>
                            </div>
                        )}

                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                className="w-full h-full p-6 font-mono text-sm resize-none focus:outline-none border-none"
                                placeholder="Start writing your resume in markdown..."
                                spellCheck={false}
                            />
                        </div>

                        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                                {markdown.split('\n').length} lines • {markdown.length} characters
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="max-sm:hidden">💾 Cmd/Ctrl+S to save</span>
                                <span className="max-sm:hidden">👁️ Cmd/Ctrl+P to toggle preview</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className={`flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden ${showPreview ? 'lg:w-1/2' : 'hidden'} max-lg:${showPreview ? 'flex' : 'hidden'}`}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <h3 className="font-semibold text-black">Live Preview</h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="live-indicator"></span>
                                Live
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-blue-50">
                            {!markdown || markdown.trim() === '' ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center animate-in fade-in duration-500">
                                        <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Start Creating Your Resume</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto">Choose a template or start typing in the editor to see your resume come to life</p>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    className="preview-paper animate-in fade-in duration-500"
                                    style={{
                                        '--theme-color': themeColor,
                                    } as React.CSSProperties}
                                >
                                    {/* Resume Header */}
                                    {frontMatter.name && (
                                        <div className="mb-6 pb-6 border-b-2" style={{ borderColor: themeColor }}>
                                            <h1 className="!text-4xl font-bold mb-3 animate-in slide-in-from-left duration-500" style={{ color: themeColor }}>
                                                {frontMatter.name}
                                            </h1>
                                            {frontMatter.header && (
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 animate-in slide-in-from-left duration-500 delay-100">
                                                    {frontMatter.header.map((item, idx) => (
                                                        <div key={idx}>
                                                            {item.link ? (
                                                                <a href={item.link} className="hover:underline transition-colors" style={{ color: themeColor }}>
                                                                    {item.text}
                                                                </a>
                                                            ) : (
                                                                <span>{item.text}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Resume Content */}
                                    <div 
                                        className="resume-content prose prose-sm max-w-none animate-in fade-in duration-700 delay-200"
                                        dangerouslySetInnerHTML={{ __html: parsedResume.html }}
                                        style={{
                                            '--tw-prose-headings': themeColor,
                                            '--tw-prose-links': themeColor,
                                        } as React.CSSProperties}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style>{`
                .resume-content h2 {
                    color: ${themeColor};
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.25rem;
                    border-bottom: 2px solid ${themeColor}40;
                }

                .resume-content h3 {
                    color: #1f2937;
                    font-size: 1rem;
                    font-weight: 600;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                }

                .resume-content p {
                    color: #374151;
                    margin-bottom: 0.75rem;
                    line-height: 1.6;
                }

                .resume-content ul {
                    list-style-type: disc;
                    margin-left: 1.5rem;
                    margin-bottom: 0.75rem;
                }

                .resume-content li {
                    color: #374151;
                    margin-bottom: 0.25rem;
                    line-height: 1.6;
                }

                .resume-content strong {
                    color: #111827;
                    font-weight: 600;
                }

                .resume-content em {
                    color: #6b7280;
                    font-style: italic;
                }

                .resume-content a {
                    color: ${themeColor};
                    text-decoration: underline;
                }

                .resume-content a:hover {
                    opacity: 0.8;
                }
            `}</style>
        </main>
    );
};

export default Editor;
