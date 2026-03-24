/**
 * Converts a byte count into a human-readable string in KB, MB, or GB.
 * @param bytes - The number of bytes to convert.
 * - Uses base 1024.
 * - Rounds to two decimal places.
 * @returns A string representing the size in KB, MB, or GB.
 */
import clsx, {type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn( ...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function formatSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 KB';
    if (bytes === 0) return '0 KB';

    const k = 1024;
    const sizes = ['KB', 'MB', 'GB', 'TB'];

    // Start from KB; values below 1 KB will be shown as 0 KB above
    let i = -1;
    let value = bytes;
    while (value >= k && i < sizes.length - 1) {
        value /= k;
        i++;
    }

    // If still below 1 KB, i will be -1; treat as KB with 0 value
    if (i === -1) {
        return '0 KB';
    }

    return `${parseFloat(value.toFixed(2))} ${sizes[i]}`;
}

export const generateUUID = () => crypto.randomUUID();

/**
 * Safely parse JSON from AI responses, with support for:
 * - Removing markdown code fences
 * - Extracting JSON from surrounding text
 * - Repairing truncated JSON by adding missing closing brackets
 * 
 * @param raw - The raw string from AI response
 * @returns Parsed JSON object or null if parsing fails
 */
export function safeParseAIJSON(raw: string): any | null {
    if (!raw) {
        console.error('safeParseAIJSON: Empty or null input');
        return null;
    }
    
    let s = raw.trim();
    
    // Log original length for diagnostics
    console.log(`📝 AI Response length: ${raw.length} characters`);
    
    // Remove markdown code fences - handle various formats
    s = s.replace(/^```(?:json)?[\r\n]+/i, '');
    s = s.replace(/[\r\n]+```\s*$/i, '');
    s = s.replace(/^```(?:json)?\s*/i, '');
    s = s.replace(/\s*```\s*$/i, '');
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
    
    // Proper bracket matching with string awareness
    for (let i = startIdx; i < s.length; i++) {
        const ch = s[i];
        let escapeNext = false;
        
        if (ch === '\\') {
            escapeNext = true;
            continue;
        }
        
        if (escapeNext) {
            escapeNext = false;
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
        
        console.warn('⚠️ Response appears truncated or incomplete. This may be due to:');
        console.warn('  - AI model output limit reached');
        console.warn('  - Network interruption');
        console.warn('  - Server timeout');
        
        // Attempt to repair truncated JSON by adding missing closing brackets
        console.log('🔧 Attempting to repair truncated JSON...');
        let repairCandidate = s.slice(startIdx);
        
        // Count open vs close brackets to determine what's missing
        let openBraces = 0, closeBraces = 0;
        let openBrackets = 0, closeBrackets = 0;
        let inStr = false;
        
        for (let j = 0; j < repairCandidate.length; j++) {
            const c = repairCandidate[j];
            if (c === '"' && (j === 0 || repairCandidate[j - 1] !== '\\')) inStr = !inStr;
            if (!inStr) {
                if (c === '{') openBraces++;
                if (c === '}') closeBraces++;
                if (c === '[') openBrackets++;
                if (c === ']') closeBrackets++;
            }
        }
        
        // Add missing closers
        const missingBraces = openBraces - closeBraces;
        const missingBrackets = openBrackets - closeBrackets;
        
        if (missingBraces > 0 || missingBrackets > 0) {
            // If in string, close it first
            if (inStr) repairCandidate += '"';
            
            // Add closing brackets/braces in reverse order of typical nesting
            for (let k = 0; k < missingBrackets; k++) repairCandidate += ']';
            for (let k = 0; k < missingBraces; k++) repairCandidate += '}';
            
            console.log(`🔧 Added ${missingBraces} closing braces and ${missingBrackets} closing brackets`);
            
            try {
                const repairedParsed = JSON.parse(repairCandidate);
                console.log('✅ Repaired JSON parsed successfully (partial data recovered)');
                return repairedParsed;
            } catch (repairError) {
                console.error('❌ JSON repair failed:', repairError);
            }
        }
        
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
}