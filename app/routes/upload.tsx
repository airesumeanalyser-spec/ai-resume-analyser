import { type FormEvent, useEffect, useState } from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import JDUploader from "~/components/JDUploader";
import UploadModeSelector from "~/components/UploadModeSelector";
import Footer from "~/components/Footer";
// TRIAL/PAYMENT DISABLED
// import TrialTracker from "~/components/TrialTracker";
import {useApiStore} from "~/lib/api";
import {Link, useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv, trial } = useApiStore();
    const navigate = useNavigate();
    const [uploadMode, setUploadMode] = useState<'manual' | 'upload'>('manual');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [progressSteps, setProgressSteps] = useState<{
        step: string;
        status: 'pending' | 'processing' | 'completed' | 'error';
    }[]>([]);



    // Require authentication for upload
    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate('/auth?next=' + encodeURIComponent('/upload'));
        }
    }, [auth.isAuthenticated, isLoading, navigate]);

    // TRIAL/PAYMENT DISABLED - Always allow usage
    // Check trial usage
    const checkTrialAvailable = (): boolean => {
        // if (trial.remaining <= 0) {
        //     setStatusText(`Free trial limit reached (${trial.max}/${trial.max} uses). Please upgrade to continue.`);
        //     return false;
        // }
        return true;
    };

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleJDFileSelect = (file: File | null) => {
        setJdFile(file);
    }

    // Handle file upload JD extraction
    const handleExtractJDFromFile = async (jdUploadFile: File): Promise<{ jobTitle: string; companyName: string; jobDescription: string } | null> => {
        try {
            const formData = new FormData();
            formData.append('file', jdUploadFile);

            const response = await fetch('/api/ai?action=extract-jd', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Server error:', result);
                throw new Error(result.error || 'Failed to extract JD');
            }

            if (!result.success) {
                console.error('Extraction failed:', result.error);
                throw new Error(result.error || 'Failed to extract JD');
            }

            return {
                jobTitle: result.jobTitle || 'Job Description',
                companyName: result.companyName || 'Not specified',
                jobDescription: result.jobDescription || '',
            };
        } catch (error) {
            console.error('Error extracting JD:', error);
            throw error;
        }
    }

    // Handle analysis with file-uploaded JD
    const handleAnalyzeWithFileUpload = async ({ file, jdFile: uploadedJDFile }: { file: File; jdFile: File }) => {
        // Check trial availability first
        if (!checkTrialAvailable()) {
            return;
        }

        setIsProcessing(true);
        setProgressSteps([
            { step: 'Checking trial usage', status: 'pending' },
            { step: 'Extracting JD information', status: 'pending' },
            { step: 'Converting PDF to image', status: 'pending' },
            { step: 'Uploading files', status: 'pending' },
            { step: 'Extracting text', status: 'pending' },
            { step: 'AI Analysis (parallel)', status: 'pending' },
            { step: 'Finalizing', status: 'pending' },
        ]);

        const updateStep = (stepIndex: number, status: 'processing' | 'completed' | 'error') => {
            setProgressSteps(prev => prev.map((s, i) => 
                i === stepIndex ? { ...s, status } : s
            ));
        };

        const startTime = performance.now();
        const timings: { [key: string]: number } = {};

        try {
            // Step 0: Check and decrement trial usage
            updateStep(0, 'processing');
            setStatusText('Verifying trial usage...');
            
            const trialResponse = await fetch('/api/ai?action=use-trial', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (!trialResponse.ok) {
                const errorData = await trialResponse.json();
                updateStep(0, 'error');
                setIsProcessing(false);
                setStatusText(errorData.error || 'Trial limit reached. Please upgrade to continue.');
                return;
            }
            
            updateStep(0, 'completed');

            // Step 1: Extract JD from file
            updateStep(1, 'processing');
            setStatusText('Extracting JD information from uploaded file...');
            const step0Start = performance.now();

            const jdData = await handleExtractJDFromFile(uploadedJDFile);
            if (!jdData) {
                updateStep(1, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to extract JD information');
            }

            timings['jd_extraction'] = performance.now() - step0Start;
            updateStep(1, 'completed');

            // Now use the extracted data with the normal handleAnalyze flow
            const { companyName, jobTitle, jobDescription } = jdData;

            // Step 2: Convert PDF to image first (required for subsequent operations)
            updateStep(2, 'processing');
            setStatusText('Converting PDF to image...');
            const step1Start = performance.now();
            const imageFile = await convertPdfToImage(file);
            timings['pdf_conversion'] = performance.now() - step1Start;
            
            if(!imageFile.file) {
                updateStep(2, 'error');
                setIsProcessing(false);
                return setStatusText(`Error: Failed to convert PDF to image${imageFile.error ? ` – ${imageFile.error}` : ''}`);
            }
            updateStep(2, 'completed');

            // Step 3: Upload both files in parallel
            updateStep(3, 'processing');
            setStatusText('Uploading files in parallel (PDF + Image)...');
            const step2Start = performance.now();
            const [uploadedFile, uploadedImage] = await Promise.all([
                fs.upload([file]),
                fs.upload([imageFile.file])
            ]);
            timings['parallel_uploads'] = performance.now() - step2Start;

            if(!uploadedFile) {
                updateStep(3, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to upload PDF file');
            }
            if(!uploadedImage) {
                updateStep(3, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to upload image file');
            }
            updateStep(3, 'completed');

            // Step 4: Prepare initial data and extract text
            updateStep(4, 'processing');
            setStatusText('Preparing data & extracting text...');
            const step3Start = performance.now();
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: '',
            }

            // Save initial data and extract text in parallel
            const [, resumeText] = await Promise.all([
                kv.set(`resume:${uuid}`, JSON.stringify(data)),
                ai.img2txt(uploadedImage.path)
            ]);
            timings['text_extraction'] = performance.now() - step3Start;

            if (!resumeText) {
                updateStep(4, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to extract text from resume');
            }
            updateStep(4, 'completed');

            // Step 5: Run analysis and markdown conversion in parallel
            updateStep(5, 'processing');
            setStatusText('Running AI analysis & markdown conversion in parallel...');
            const step4Start = performance.now();
            const [feedbackResponse, markdownText] = await Promise.all([
                ai.feedback(
                    resumeText,
                    prepareInstructions({ jobTitle, jobDescription })
                ),
                ai.convertToMarkdown(resumeText)
            ]);
            timings['parallel_ai_analysis'] = performance.now() - step4Start;

            if(!feedbackResponse) {
                updateStep(5, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to analyze resume');
            }
            updateStep(5, 'completed');

            // The feedback API returns { success: true, feedback: "..." }, not an AIResponse
            const feedbackText = typeof feedbackResponse === 'string' 
                ? feedbackResponse 
                : (feedbackResponse as any).feedback || JSON.stringify(feedbackResponse);

            // Store all results in parallel
            const storagePromises = [
                kv.set(`resume:${uuid}:text`, resumeText)
            ];
            
            if (markdownText) {
                storagePromises.push(kv.set(`resume:${uuid}:markdown`, markdownText));
            }
            
            await Promise.all(storagePromises);

            // Step 6: Parse and validate AI response
            updateStep(6, 'processing');
            setStatusText('Processing AI response...');

            // Safely parse LLM output which may include code fences or extra text
            const safeParseJSON = (raw: string): any | null => {
                if (!raw) {
                    console.error('safeParseJSON: Empty or null input');
                    return null;
                }
                
                let s = raw.trim();
                
                // Log original length for diagnostics
                console.log(`📝 AI Response length: ${raw.length} characters`);
                
                // Remove markdown code fences - handle various formats
                // Match: ```json\n ... \n``` or ```\n ... \n``` or ``` ... ```
                s = s.replace(/^```(?:json)?[\r\n]+/i, '');  // Remove opening fence with newline
                s = s.replace(/[\r\n]+```\s*$/i, '');        // Remove closing fence with newline
                s = s.replace(/^```(?:json)?\s*/i, '');      // Remove opening fence with space
                s = s.replace(/\s*```\s*$/i, '');            // Remove closing fence with space
                s = s.trim();
                
                // Find first JSON object or array via bracket matching
                const startIdx = (() => {
                    const obj = s.indexOf('{');
                    const arr = s.indexOf('[');
                    if (obj === -1) return arr;
                    if (arr === -1) return obj;
                    return Math.min(obj, arr);
                })();
                
                if (startIdx < 0) {
                    console.error('❌ No JSON object or array found');
                    console.error('Content preview:', s.substring(0, 300));
                    return null;
                }
                
                const openChar = s[startIdx];
                const closeChar = openChar === '{' ? '}' : ']';
                let depth = 0;
                let endIdx = -1;
                let inString = false;
                let escapeNext = false;
                
                for (let i = startIdx; i < s.length; i++) {
                    const ch = s[i];
                    
                    // Handle escape sequences
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    
                    if (ch === '\\') {
                        escapeNext = true;
                        continue;
                    }
                    
                    // Handle strings
                    if (ch === '"') {
                        inString = !inString;
                        continue;
                    }
                    
                    // Only count brackets outside of strings
                    if (!inString) {
                        if (ch === openChar) depth++;
                        else if (ch === closeChar) depth--;
                        
                        if (depth === 0) {
                            endIdx = i + 1;
                            break;
                        }
                    }
                }
                
                if (endIdx === -1) {
                    console.error('❌ No matching closing bracket found');
                    console.error('📊 Debug info:', {
                        totalLength: s.length,
                        startIdx,
                        finalDepth: depth,
                        inString,
                        openChar,
                        closeChar
                    });
                    console.error('🔍 Content sample (first 1000 chars):');
                    console.error(s.substring(0, 1000));
                    console.error('🔍 Content sample (last 500 chars):');
                    console.error(s.substring(Math.max(0, s.length - 500)));
                    
                    // Try to recover: if response seems truncated, suggest retry
                    console.warn('⚠️ Response appears truncated or incomplete. This may be due to:');
                    console.warn('  - AI model output limit reached');
                    console.warn('  - Network interruption');
                    console.warn('  - Server timeout');
                    
                    return null;
                }
                
                const candidate = s.slice(startIdx, endIdx);
                console.log(`✅ Extracted JSON candidate (${candidate.length} chars)`);
                
                try {
                    const parsed = JSON.parse(candidate);
                    console.log('✅ JSON parsed successfully');
                    return parsed;
                } catch (e) {
                    console.error('❌ Failed to parse AI JSON');
                    console.error('Error:', e);
                    console.error('Candidate JSON (first 800 chars):');
                    console.error(candidate.substring(0, 800));
                    console.error('Candidate JSON (last 200 chars):');
                    console.error(candidate.substring(Math.max(0, candidate.length - 200)));
                    
                    // Try to identify common JSON errors
                    if (e instanceof SyntaxError) {
                        const msg = e.message;
                        if (msg.includes('Unexpected token')) {
                            console.error('💡 Hint: Check for unescaped characters or invalid syntax');
                        } else if (msg.includes('Unexpected end')) {
                            console.error('💡 Hint: JSON appears truncated - missing closing brackets');
                        }
                    }
                    
                    return null;
                }
            };

            const parsed = safeParseJSON(feedbackText);
            if (!parsed) {
                updateStep(6, 'error');
                setStatusText('Error: Received malformed analysis from AI. Please try again.');
                // Preserve raw for debugging
                await kv.set(`resume:${uuid}:raw`, feedbackText);
                setIsProcessing(false);
                return;
            }

            // Save final results and redirect
            data.feedback = parsed;
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            updateStep(6, 'completed');
            
            // Refresh auth to update trial count
            await auth.checkAuthStatus();
            
            // Calculate total time and log performance metrics
            const totalTime = performance.now() - startTime;
            timings['total'] = totalTime;
            console.log('📊 Performance Metrics:', {
                total: `${(totalTime / 1000).toFixed(2)}s`,
                breakdown: {
                    jd_extraction: `${(timings.jd_extraction / 1000).toFixed(2)}s`,
                    pdf_conversion: `${(timings.pdf_conversion / 1000).toFixed(2)}s`,
                    parallel_uploads: `${(timings.parallel_uploads / 1000).toFixed(2)}s`,
                    text_extraction: `${(timings.text_extraction / 1000).toFixed(2)}s`,
                    parallel_ai_analysis: `${(timings.parallel_ai_analysis / 1000).toFixed(2)}s`,
                }
            });
            
            setStatusText('Analysis Complete! Redirecting...');
            console.log(data);
            
            // Small delay to show completion before redirect
            setTimeout(() => navigate(`/resume/${uuid}`), 500);

        } catch (error) {
            console.error('Analysis error:', error);
            setStatusText(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            setIsProcessing(false);
        }
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        // Check trial availability first
        if (!checkTrialAvailable()) {
            return;
        }

        setIsProcessing(true);
        setProgressSteps([
            { step: 'Checking trial usage', status: 'pending' },
            { step: 'Converting PDF to image', status: 'pending' },
            { step: 'Uploading files', status: 'pending' },
            { step: 'Extracting text', status: 'pending' },
            { step: 'AI Analysis (parallel)', status: 'pending' },
            { step: 'Finalizing', status: 'pending' },
        ]);

        const updateStep = (stepIndex: number, status: 'processing' | 'completed' | 'error') => {
            setProgressSteps(prev => prev.map((s, i) => 
                i === stepIndex ? { ...s, status } : s
            ));
        };

        // Performance monitoring
        const startTime = performance.now();
        const timings: { [key: string]: number } = {};

        try {
            // Step 0: Check and decrement trial usage
            updateStep(0, 'processing');
            setStatusText('Verifying trial usage...');
            
            const trialResponse = await fetch('/api/ai?action=use-trial', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (!trialResponse.ok) {
                const errorData = await trialResponse.json();
                updateStep(0, 'error');
                setIsProcessing(false);
                setStatusText(errorData.error || 'Trial limit reached. Please upgrade to continue.');
                return;
            }
            
            updateStep(0, 'completed');

            // Step 1: Convert PDF to image first (required for subsequent operations)
            updateStep(1, 'processing');
            setStatusText('Converting PDF to image...');
            const step1Start = performance.now();
            const imageFile = await convertPdfToImage(file);
            timings['pdf_conversion'] = performance.now() - step1Start;
            
            if(!imageFile.file) {
                updateStep(1, 'error');
                setIsProcessing(false);
                return setStatusText(`Error: Failed to convert PDF to image${imageFile.error ? ` – ${imageFile.error}` : ''}`);
            }
            updateStep(1, 'completed');

            // Step 2: Upload both files in parallel
            updateStep(2, 'processing');
            setStatusText('Uploading files in parallel (PDF + Image)...');
            const step2Start = performance.now();
            const [uploadedFile, uploadedImage] = await Promise.all([
                fs.upload([file]),
                fs.upload([imageFile.file])
            ]);
            timings['parallel_uploads'] = performance.now() - step2Start;

            if(!uploadedFile) {
                updateStep(2, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to upload PDF file');
            }
            if(!uploadedImage) {
                updateStep(2, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to upload image file');
            }
            updateStep(2, 'completed');

            // Step 3: Prepare initial data and extract text
            updateStep(3, 'processing');
            setStatusText('Preparing data & extracting text...');
            const step3Start = performance.now();
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: '',
            }

            // Save initial data and extract text in parallel
            const [, resumeText] = await Promise.all([
                kv.set(`resume:${uuid}`, JSON.stringify(data)),
                ai.img2txt(uploadedImage.path)
            ]);
            timings['text_extraction'] = performance.now() - step3Start;

            if (!resumeText) {
                updateStep(3, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to extract text from resume');
            }
            updateStep(3, 'completed');

            // Step 4: Run analysis and markdown conversion in parallel
            updateStep(4, 'processing');
            setStatusText('Running AI analysis & markdown conversion in parallel...');
            const step4Start = performance.now();
            const [feedbackResponse, markdownText] = await Promise.all([
                ai.feedback(
                    resumeText,
                    prepareInstructions({ jobTitle, jobDescription })
                ),
                ai.convertToMarkdown(resumeText)
            ]);
            timings['parallel_ai_analysis'] = performance.now() - step4Start;

            if(!feedbackResponse) {
                updateStep(4, 'error');
                setIsProcessing(false);
                return setStatusText('Error: Failed to analyze resume');
            }
            updateStep(4, 'completed');

            // The feedback API returns { success: true, feedback: "..." }, not an AIResponse
            const feedbackText = typeof feedbackResponse === 'string' 
                ? feedbackResponse 
                : (feedbackResponse as any).feedback || JSON.stringify(feedbackResponse);

            // Store all results in parallel
            const storagePromises = [
                kv.set(`resume:${uuid}:text`, resumeText)
            ];
            
            if (markdownText) {
                storagePromises.push(kv.set(`resume:${uuid}:markdown`, markdownText));
            }
            
            await Promise.all(storagePromises);

            // Step 5: Parse and validate AI response
            updateStep(5, 'processing');
            setStatusText('Processing AI response...');

            // Safely parse LLM output which may include code fences or extra text
            const safeParseJSON = (raw: string): any | null => {
                if (!raw) {
                    console.error('safeParseJSON: Empty or null input');
                    return null;
                }
                
                let s = raw.trim();
                
                // Log original length for diagnostics
                console.log(`📝 AI Response length: ${raw.length} characters`);
                
                // Remove markdown code fences - handle various formats
                // Match: ```json\n ... \n``` or ```\n ... \n``` or ``` ... ```
                s = s.replace(/^```(?:json)?[\r\n]+/i, '');  // Remove opening fence with newline
                s = s.replace(/[\r\n]+```\s*$/i, '');        // Remove closing fence with newline
                s = s.replace(/^```(?:json)?\s*/i, '');      // Remove opening fence with space
                s = s.replace(/\s*```\s*$/i, '');            // Remove closing fence with space
                s = s.trim();
                
                // Find first JSON object or array via bracket matching
                const startIdx = (() => {
                    const obj = s.indexOf('{');
                    const arr = s.indexOf('[');
                    if (obj === -1) return arr;
                    if (arr === -1) return obj;
                    return Math.min(obj, arr);
                })();
                
                if (startIdx < 0) {
                    console.error('❌ No JSON object or array found');
                    console.error('Content preview:', s.substring(0, 300));
                    return null;
                }
                
                const openChar = s[startIdx];
                const closeChar = openChar === '{' ? '}' : ']';
                let depth = 0;
                let endIdx = -1;
                let inString = false;
                let escapeNext = false;
                
                for (let i = startIdx; i < s.length; i++) {
                    const ch = s[i];
                    
                    // Handle escape sequences
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    
                    if (ch === '\\') {
                        escapeNext = true;
                        continue;
                    }
                    
                    // Handle strings
                    if (ch === '"') {
                        inString = !inString;
                        continue;
                    }
                    
                    // Only count brackets outside of strings
                    if (!inString) {
                        if (ch === openChar) depth++;
                        else if (ch === closeChar) depth--;
                        
                        if (depth === 0) {
                            endIdx = i + 1;
                            break;
                        }
                    }
                }
                
                if (endIdx === -1) {
                    console.error('❌ No matching closing bracket found');
                    console.error('📊 Debug info:', {
                        totalLength: s.length,
                        startIdx,
                        finalDepth: depth,
                        inString,
                        openChar,
                        closeChar
                    });
                    console.error('🔍 Content sample (first 1000 chars):');
                    console.error(s.substring(0, 1000));
                    console.error('🔍 Content sample (last 500 chars):');
                    console.error(s.substring(Math.max(0, s.length - 500)));
                    
                    // Try to recover: if response seems truncated, suggest retry
                    console.warn('⚠️ Response appears truncated or incomplete. This may be due to:');
                    console.warn('  - AI model output limit reached');
                    console.warn('  - Network interruption');
                    console.warn('  - Server timeout');
                    
                    return null;
                }
                
                const candidate = s.slice(startIdx, endIdx);
                console.log(`✅ Extracted JSON candidate (${candidate.length} chars)`);
                
                try {
                    const parsed = JSON.parse(candidate);
                    console.log('✅ JSON parsed successfully');
                    return parsed;
                } catch (e) {
                    console.error('❌ Failed to parse AI JSON');
                    console.error('Error:', e);
                    console.error('Candidate JSON (first 800 chars):');
                    console.error(candidate.substring(0, 800));
                    console.error('Candidate JSON (last 200 chars):');
                    console.error(candidate.substring(Math.max(0, candidate.length - 200)));
                    
                    // Try to identify common JSON errors
                    if (e instanceof SyntaxError) {
                        const msg = e.message;
                        if (msg.includes('Unexpected token')) {
                            console.error('💡 Hint: Check for unescaped characters or invalid syntax');
                        } else if (msg.includes('Unexpected end')) {
                            console.error('💡 Hint: JSON appears truncated - missing closing brackets');
                        }
                    }
                    
                    return null;
                }
            };

            const parsed = safeParseJSON(feedbackText);
            if (!parsed) {
                updateStep(5, 'error');
                setStatusText('Error: Received malformed analysis from AI. Please try again.');
                // Preserve raw for debugging
                await kv.set(`resume:${uuid}:raw`, feedbackText);
                setIsProcessing(false);
                return;
            }

            // Save final results and redirect
            data.feedback = parsed;
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            updateStep(5, 'completed');
            
            // Refresh auth to update trial count
            await auth.checkAuthStatus();
            
            // Calculate total time and log performance metrics
            const totalTime = performance.now() - startTime;
            timings['total'] = totalTime;
            console.log('📊 Performance Metrics:', {
                total: `${(totalTime / 1000).toFixed(2)}s`,
                breakdown: {
                    pdf_conversion: `${(timings.pdf_conversion / 1000).toFixed(2)}s`,
                    parallel_uploads: `${(timings.parallel_uploads / 1000).toFixed(2)}s`,
                    text_extraction: `${(timings.text_extraction / 1000).toFixed(2)}s`,
                    parallel_ai_analysis: `${(timings.parallel_ai_analysis / 1000).toFixed(2)}s`,
                }
            });
            
            setStatusText('Analysis Complete! Redirecting...');
            console.log(data);
            
            // Small delay to show completion before redirect
            setTimeout(() => navigate(`/resume/${uuid}`), 500);

        } catch (error) {
            console.error('Analysis error:', error);
            setStatusText(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        if (uploadMode === 'manual') {
            // Manual JD mode
            const companyName = formData.get('company-name') as string;
            const jobTitle = formData.get('job-title') as string;
            const jobDescription = formData.get('job-description') as string;

            if(!file) return;

            handleAnalyze({ companyName, jobTitle, jobDescription, file });
        } else {
            // File upload mode
            if (!file || !jdFile) {
                setStatusText('Error: Please upload both resume and JD files');
                return;
            }

            handleAnalyzeWithFileUpload({ file, jdFile });
        }
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex flex-col">
            <Navbar />

            <section className="main-section flex-1">
                <div className="page-heading py-16">
                    <h1>AI Resume Analysis</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            
                            {/* Progress Steps */}
                            <div className="mt-8 mb-6 max-w-2xl mx-auto">
                                <div className="space-y-3">
                                    {progressSteps.map((step, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                                step.status === 'completed' ? 'bg-green-500 text-white' :
                                                step.status === 'processing' ? 'bg-blue-500 text-white animate-pulse' :
                                                step.status === 'error' ? 'bg-red-500 text-white' :
                                                'bg-gray-300 text-gray-600'
                                            }`}>
                                                {step.status === 'completed' ? '✓' :
                                                 step.status === 'error' ? '✗' :
                                                 index + 1}
                                            </div>
                                            <div className={`flex-1 text-left ${
                                                step.status === 'completed' ? 'text-green-600 font-medium' :
                                                step.status === 'processing' ? 'text-blue-600 font-semibold' :
                                                step.status === 'error' ? 'text-red-600 font-medium' :
                                                'text-gray-500'
                                            }`}>
                                                {step.step}
                                                {step.status === 'processing' && (
                                                    <span className="ml-2 inline-block">
                                                        <svg className="animate-spin h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <img src="/images/resume-scan.gif" className="w-full max-w-md mx-auto" />
                        </>
                    ) : (
                        <>
                            <h2>Upload your resume for instant ATS scoring and AI-powered feedback</h2>
                            <p className="text-gray-600 mt-2">
                                Want to create a new resume instead? <Link to="/editor/new" className="text-blue-600 hover:underline font-semibold">Use our Resume Editor →</Link>
                            </p>
                        </>
                    )}
                    {!isProcessing && (
                        <>
                            {/* TRIAL/PAYMENT DISABLED - Real-time Trial Tracker */}
                            {/* <div className="max-w-md mx-auto mb-6">
                                <TrialTracker />
                            </div> */}
                            
                            <UploadModeSelector 
                                mode={uploadMode} 
                                onModeChange={setUploadMode}
                            />

                            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                                {uploadMode === 'manual' ? (
                                    <>
                                        <div className="form-div">
                                            <label htmlFor="company-name">Company Name</label>
                                            <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                                        </div>
                                        <div className="form-div">
                                            <label htmlFor="job-title">Job Title</label>
                                            <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                                        </div>
                                        <div className="form-div">
                                            <label htmlFor="job-description">Job Description</label>
                                            <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                                        </div>

                                        <div className="form-div">
                                            <label htmlFor="uploader">Upload Resume</label>
                                            <FileUploader onFileSelect={handleFileSelect} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-div">
                                            <label htmlFor="jd-uploader">Upload Job Description (PDF or DOCX)</label>
                                            <JDUploader onFileSelect={handleJDFileSelect} />
                                        </div>

                                        <div className="form-div">
                                            <label htmlFor="resume-uploader">Upload Resume (PDF)</label>
                                            <FileUploader onFileSelect={handleFileSelect} />
                                        </div>

                                        {jdFile && (
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-sm text-gray-700">
                                                    ✅ JD Information will be automatically extracted from your uploaded file
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}

                                <button className="primary-button" type="submit">
                                    {uploadMode === 'manual' ? 'Analyze Resume' : 'Analyze Resume & JD'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </section>
            <Footer />
        </main>
    )
}
export default Upload