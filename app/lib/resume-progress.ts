/**
 * Resume Progress Utilities
 * Calculate resume completeness and ATS compliance
 */

import type { ParsedResume } from './resume-parser';
import type { ProgressStep } from '../components/ProgressTracker';
import type { ChecklistItem } from '../components/ATSChecklist';

/**
 * Calculate overall resume completeness
 */
export function calculateResumeProgress(markdown: string, parsedResume: ParsedResume | null): number {
    if (!markdown || !parsedResume) return 0;

    const checks = [
        // Basic structure (20%)
        markdown.length > 100, // Has content
        parsedResume.frontMatter.name, // Has name
        parsedResume.frontMatter.header && parsedResume.frontMatter.header.length > 0, // Has contact info
        
        // Content sections (60%)
        markdown.includes('## Experience') || markdown.includes('## Work Experience'),
        markdown.includes('## Education'),
        markdown.includes('## Skills'),
        markdown.includes('## Summary') || markdown.includes('## Professional Summary'),
        
        // Bullet points and formatting (20%)
        markdown.includes('- '), // Has bullet points
        markdown.includes('**'), // Has bold text
        markdown.length > 500, // Substantial content
    ];

    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
}

/**
 * Generate progress steps based on resume state
 */
export function generateProgressSteps(
    markdown: string,
    parsedResume: ParsedResume | null,
    hasAnalysis: boolean = false,
    hasSuggestions: boolean = false
): ProgressStep[] {
    const hasContent = markdown.length > 100;
    const hasName = !!parsedResume?.frontMatter.name;
    const hasContact = parsedResume?.frontMatter.header && parsedResume.frontMatter.header.length > 0;
    const hasSections = markdown.includes('##');
    const hasExperience = markdown.includes('## Experience') || markdown.includes('## Work Experience');
    const hasEducation = markdown.includes('## Education');
    const hasSkills = markdown.includes('## Skills');

    // Calculate scores for each step
    const createScore = hasContent && hasName && hasContact ? 100 : hasContent ? 50 : 0;
    const structureScore = [hasSections, hasExperience, hasEducation, hasSkills].filter(Boolean).length * 25;
    const analysisScore = hasAnalysis ? 100 : 0;
    const improvementScore = hasSuggestions ? 100 : 0;

    return [
        {
            id: 'create',
            title: 'Create Resume',
            description: 'Add your basic information and contact details',
            status: hasName && hasContact ? 'completed' : hasContent ? 'current' : 'pending',
            score: createScore,
            requiredForATS: true,
        },
        {
            id: 'structure',
            title: 'Add Content',
            description: 'Fill in your experience, education, and skills',
            status: hasExperience && hasEducation && hasSkills ? 'completed' : hasSections ? 'current' : 'pending',
            score: structureScore,
            requiredForATS: true,
        },
        {
            id: 'analyze',
            title: 'AI Analysis',
            description: 'Get AI-powered feedback on your resume',
            status: hasAnalysis ? 'completed' : structureScore >= 75 ? 'current' : 'pending',
            score: analysisScore,
            requiredForATS: false,
        },
        {
            id: 'improve',
            title: 'Apply Improvements',
            description: 'Review and apply AI suggestions',
            status: improvementScore === 100 ? 'completed' : hasAnalysis ? 'current' : 'pending',
            score: improvementScore,
            requiredForATS: false,
        },
        {
            id: 'export',
            title: 'Export',
            description: 'Download your ATS-optimized resume',
            status: improvementScore === 100 ? 'current' : 'pending',
            score: 0,
            requiredForATS: false,
        },
    ];
}

/**
 * Generate ATS checklist based on resume analysis
 */
export function generateATSChecklist(markdown: string, parsedResume: ParsedResume | null): ChecklistItem[] {
    if (!markdown || !parsedResume) {
        return getDefaultChecklist();
    }

    const items: ChecklistItem[] = [];

    // Contact Information
    const hasEmail = parsedResume.frontMatter.header?.some(h => h.text.includes('@')) ?? false;
    const hasPhone = parsedResume.frontMatter.header?.some(h => /\d{3}/.test(h.text)) ?? false;
    const hasLocation = parsedResume.frontMatter.header?.some(h => 
        h.text.toLowerCase().includes('city') || 
        h.text.toLowerCase().includes('state') ||
        h.text.split(',').length > 1
    ) ?? false;

    items.push({
        id: 'contact-email',
        title: 'Email Address',
        description: 'Professional email address is present',
        status: hasEmail ? 'passed' : 'failed',
        category: 'required',
        helpText: 'Add your email address in the frontmatter header section.',
        autoFixAvailable: false,
    });

    items.push({
        id: 'contact-phone',
        title: 'Phone Number',
        description: 'Contact phone number is included',
        status: hasPhone ? 'passed' : 'warning',
        category: 'recommended',
        helpText: 'Add your phone number to the header section for better reach.',
        autoFixAvailable: false,
    });

    items.push({
        id: 'contact-location',
        title: 'Location',
        description: 'City and state/country information',
        status: hasLocation ? 'passed' : 'warning',
        category: 'recommended',
        helpText: 'Add your location (e.g., "San Francisco, CA") to help with location-based filtering.',
        autoFixAvailable: false,
    });

    // Required Sections
    const hasExperience = markdown.includes('## Experience') || markdown.includes('## Work Experience');
    const hasEducation = markdown.includes('## Education');
    const hasSkills = markdown.includes('## Skills');
    const hasSummary = markdown.includes('## Summary') || markdown.includes('## Professional Summary');

    items.push({
        id: 'section-experience',
        title: 'Work Experience Section',
        description: 'Experience/Work history is present',
        status: hasExperience ? 'passed' : 'failed',
        category: 'required',
        helpText: 'Add a "## Experience" or "## Work Experience" section with your job history.',
        autoFixAvailable: true,
    });

    items.push({
        id: 'section-education',
        title: 'Education Section',
        description: 'Educational background is documented',
        status: hasEducation ? 'passed' : 'failed',
        category: 'required',
        helpText: 'Add an "## Education" section with your degrees and institutions.',
        autoFixAvailable: true,
    });

    items.push({
        id: 'section-skills',
        title: 'Skills Section',
        description: 'Technical and soft skills are listed',
        status: hasSkills ? 'passed' : 'warning',
        category: 'required',
        helpText: 'Add a "## Skills" section with relevant technical and soft skills.',
        autoFixAvailable: true,
    });

    items.push({
        id: 'section-summary',
        title: 'Professional Summary',
        description: 'Brief professional summary at the top',
        status: hasSummary ? 'passed' : 'warning',
        category: 'recommended',
        helpText: 'Add a "## Summary" section at the top with 2-3 sentences about your professional background.',
        autoFixAvailable: true,
    });

    // Formatting Checks
    const hasBulletPoints = (markdown.match(/^- /gm) || []).length >= 3;
    const hasBoldText = markdown.includes('**');
    const hasActionVerbs = /\b(developed|managed|led|created|designed|implemented|improved|increased|reduced)\b/i.test(markdown);
    const hasQuantification = /\d+%|\$\d+|#\d+/.test(markdown);

    items.push({
        id: 'format-bullets',
        title: 'Bullet Points',
        description: 'Uses bullet points for achievements',
        status: hasBulletPoints ? 'passed' : 'warning',
        category: 'recommended',
        helpText: 'Use bullet points (- ) to list your achievements and responsibilities.',
        autoFixAvailable: false,
    });

    items.push({
        id: 'format-emphasis',
        title: 'Text Emphasis',
        description: 'Uses bold for important information',
        status: hasBoldText ? 'passed' : 'warning',
        category: 'optional',
        helpText: 'Use **bold** to emphasize job titles, company names, and key achievements.',
        autoFixAvailable: false,
    });

    items.push({
        id: 'content-action-verbs',
        title: 'Action Verbs',
        description: 'Uses strong action verbs',
        status: hasActionVerbs ? 'passed' : 'warning',
        category: 'recommended',
        helpText: 'Start bullet points with strong action verbs like "Developed", "Led", "Managed", etc.',
        autoFixAvailable: false,
    });

    items.push({
        id: 'content-quantification',
        title: 'Quantified Achievements',
        description: 'Includes numbers and metrics',
        status: hasQuantification ? 'passed' : 'warning',
        category: 'recommended',
        helpText: 'Add specific numbers, percentages, or metrics to quantify your achievements.',
        autoFixAvailable: false,
    });

    // Length Check
    const wordCount = markdown.split(/\s+/).length;
    const idealLength = wordCount >= 300 && wordCount <= 800;

    items.push({
        id: 'length-check',
        title: 'Resume Length',
        description: 'Appropriate length (300-800 words)',
        status: idealLength ? 'passed' : wordCount < 300 ? 'warning' : 'failed',
        category: 'recommended',
        helpText: wordCount < 300 
            ? 'Add more details about your experience and achievements. Aim for 300-800 words.'
            : 'Consider condensing your resume. ATS prefers concise resumes under 800 words.',
        autoFixAvailable: false,
    });

    // File Format (always passes for markdown)
    items.push({
        id: 'format-simple',
        title: 'Simple Formatting',
        description: 'Uses ATS-friendly markdown formatting',
        status: 'passed',
        category: 'required',
        helpText: 'Your markdown format is ATS-friendly!',
        autoFixAvailable: false,
    });

    return items;
}

/**
 * Get default checklist when no resume is loaded
 */
function getDefaultChecklist(): ChecklistItem[] {
    return [
        {
            id: 'start',
            title: 'Create Resume',
            description: 'Start creating your resume to see ATS checks',
            status: 'pending',
            category: 'required',
            helpText: 'Begin by adding your name and contact information.',
            autoFixAvailable: false,
        },
    ];
}

/**
 * Calculate ATS score from checklist
 */
export function calculateATSScore(items: ChecklistItem[]): number {
    if (items.length === 0) return 0;

    const weights = {
        required: 3,
        recommended: 2,
        optional: 1,
    };

    let totalWeight = 0;
    let earnedWeight = 0;

    items.forEach(item => {
        const weight = weights[item.category];
        totalWeight += weight;
        
        if (item.status === 'passed') {
            earnedWeight += weight;
        } else if (item.status === 'warning') {
            earnedWeight += weight * 0.5; // Half credit for warnings
        }
    });

    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}
