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