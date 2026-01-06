/**
 * Markdown-based Resume Parser and Renderer
 * Adapted from Oh-My-CV for React Router integration
 */

import MarkdownIt from 'markdown-it';

export interface ResumeHeaderItem {
    text: string;
    link?: string;
    newLine?: boolean;
}

export interface ResumeFrontMatter {
    name?: string;
    header?: ResumeHeaderItem[];
    themeColor?: string;
}

export interface ParsedResume {
    frontMatter: ResumeFrontMatter;
    markdown: string;
    html: string;
}

/**
 * Parse front matter from markdown
 */
export function parseFrontMatter(markdown: string): { frontMatter: ResumeFrontMatter; content: string } {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = markdown.match(frontMatterRegex);

    if (!match) {
        return {
            frontMatter: {},
            content: markdown,
        };
    }

    const frontMatterStr = match[1];
    const content = match[2];

    // Simple YAML parser for resume front matter
    const frontMatter: ResumeFrontMatter = {};
    const lines = frontMatterStr.split('\n');
    
    let currentKey: string | null = null;
    let inHeader = false;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('name:')) {
            frontMatter.name = trimmed.substring(5).trim().replace(/['"]/g, '');
        } else if (trimmed === 'header:') {
            inHeader = true;
            frontMatter.header = [];
        } else if (trimmed.startsWith('themeColor:')) {
            frontMatter.themeColor = trimmed.substring(11).trim().replace(/['"]/g, '');
        } else if (inHeader && trimmed.startsWith('- text:')) {
            const text = trimmed.substring(7).trim().replace(/['"]/g, '');
            frontMatter.header!.push({ text });
        } else if (inHeader && trimmed.startsWith('link:')) {
            const link = trimmed.substring(5).trim().replace(/['"]/g, '');
            if (frontMatter.header && frontMatter.header.length > 0) {
                frontMatter.header[frontMatter.header.length - 1].link = link;
            }
        }
    }

    return { frontMatter, content };
}

/**
 * Convert markdown to HTML with resume styling
 */
export function markdownToHtml(markdown: string): string {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
    });

    // Add custom rendering for resume elements
    const defaultRender = md.renderer.rules.link_open || function(tokens: any, idx: any, options: any, env: any, self: any) {
        return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.link_open = function(tokens: any, idx: any, options: any, env: any, self: any) {
        // Add target="_blank" to external links
        const aIndex = tokens[idx].attrIndex('target');
        if (aIndex < 0) {
            tokens[idx].attrPush(['target', '_blank']);
        } else {
            tokens[idx].attrs![aIndex][1] = '_blank';
        }
        return defaultRender(tokens, idx, options, env, self);
    };

    return md.render(markdown);
}

/**
 * Parse markdown resume into structured format
 */
export function parseResume(markdown: string): ParsedResume {
    const { frontMatter, content } = parseFrontMatter(markdown);
    const html = markdownToHtml(content);

    return {
        frontMatter,
        markdown: content,
        html,
    };
}

/**
 * Apply AI suggestions to markdown resume
 */
export function applyAISuggestions(
    markdown: string,
    suggestions: Array<{
        section: string;
        original: string;
        improved: string;
    }>
): string {
    let updatedMarkdown = markdown;

    for (const suggestion of suggestions) {
        // Try to find and replace the original text
        if (updatedMarkdown.includes(suggestion.original)) {
            updatedMarkdown = updatedMarkdown.replace(
                suggestion.original,
                suggestion.improved
            );
        }
    }

    return updatedMarkdown;
}

/**
 * Generate default resume template
 */
export function getDefaultResumeTemplate(): string {
    return `---
name: John Doe
header:
  - text: john.doe@email.com
    link: mailto:john.doe@email.com
  - text: (555) 123-4567
  - text: linkedin.com/in/johndoe
    link: https://linkedin.com/in/johndoe
  - text: github.com/johndoe
    link: https://github.com/johndoe
themeColor: '#2563eb'
---

## Professional Summary

Results-driven software engineer with 5+ years of experience building scalable web applications. Proven track record of leading cross-functional teams and delivering high-impact projects.

## Experience

**Senior Software Engineer** | Tech Corp | *2020 - Present*

- Led development of microservices architecture serving 1M+ daily active users
- Improved system performance by 40% through optimization and caching strategies
- Mentored 5 junior developers and established code review best practices
- Technologies: React, Node.js, PostgreSQL, AWS

**Software Developer** | StartUp Inc | *2018 - 2020*

- Built responsive web applications using modern JavaScript frameworks
- Collaborated with designers to implement pixel-perfect UI components
- Reduced page load time by 60% through performance optimization
- Technologies: Vue.js, Python, MongoDB, Docker

## Education

**Bachelor of Science in Computer Science** | University of Technology | *2018*

- GPA: 3.8/4.0
- Dean's List (2016-2018)
- Relevant Coursework: Data Structures, Algorithms, Web Development

## Skills

**Languages:** JavaScript, TypeScript, Python, Java
**Frameworks:** React, Node.js, Express, Next.js
**Databases:** PostgreSQL, MongoDB, Redis
**Tools:** Git, Docker, AWS, CI/CD

## Projects

**Open Source Contributor** | Various Projects | *2019 - Present*

- Contributed to 10+ open source projects with 500+ GitHub stars
- Implemented features and fixed bugs in popular npm packages
- Active participant in code reviews and technical discussions
`;
}

/**
 * Extract sections from markdown for targeted editing
 */
export function extractSections(markdown: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = markdown.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            currentSection = line.substring(3).trim();
            currentContent = [];
        } else if (currentSection) {
            currentContent.push(line);
        }
    }

    if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
}

/**
 * Update specific section in markdown
 */
export function updateSection(markdown: string, sectionName: string, newContent: string): string {
    const sections = extractSections(markdown);
    sections[sectionName] = newContent;

    // Rebuild markdown
    const { frontMatter, content } = parseFrontMatter(markdown);
    let frontMatterStr = '';
    
    if (Object.keys(frontMatter).length > 0) {
        frontMatterStr = '---\n';
        if (frontMatter.name) {
            frontMatterStr += `name: ${frontMatter.name}\n`;
        }
        if (frontMatter.header && frontMatter.header.length > 0) {
            frontMatterStr += 'header:\n';
            frontMatter.header.forEach(item => {
                frontMatterStr += `  - text: ${item.text}\n`;
                if (item.link) {
                    frontMatterStr += `    link: ${item.link}\n`;
                }
            });
        }
        if (frontMatter.themeColor) {
            frontMatterStr += `themeColor: '${frontMatter.themeColor}'\n`;
        }
        frontMatterStr += '---\n\n';
    }

    let updatedContent = '';
    for (const [section, sectionContent] of Object.entries(sections)) {
        updatedContent += `## ${section}\n\n${sectionContent}\n\n`;
    }

    return frontMatterStr + updatedContent.trim();
}

/**
 * Convert analysis to markdown suggestions
 */
export function analysisToSuggestions(analysis: any): Array<{
    section: string;
    original: string;
    improved: string;
    priority: string;
}> {
    if (!analysis || !analysis.improvements) {
        return [];
    }

    return analysis.improvements.map((improvement: any) => ({
        section: improvement.category || 'General',
        original: improvement.issue || '',
        improved: improvement.suggestion || '',
        priority: improvement.priority || 'medium',
    }));
}
