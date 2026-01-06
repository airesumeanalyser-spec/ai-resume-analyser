/**
 * Suggestion Tooltip Component
 * Shows contextual tooltips for suggestions in the editor
 */

import { useState, useEffect, useRef } from 'react';
import type { Suggestion } from './InlineSuggestions';

interface SuggestionTooltipProps {
    suggestion: Suggestion;
    position: { x: number; y: number };
    onAccept: () => void;
    onReject: () => void;
    onClose: () => void;
}

const SEVERITY_COLORS = {
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
};

const CATEGORY_ICONS = {
    ats: '🎯',
    content: '📝',
    formatting: '🎨',
    grammar: '✍️',
};

export function SuggestionTooltip({
    suggestion,
    position,
    onAccept,
    onReject,
    onClose,
}: SuggestionTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    // Adjust position to keep tooltip within viewport
    useEffect(() => {
        if (tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let x = position.x;
            let y = position.y;

            // Adjust horizontal position
            if (x + rect.width > viewportWidth - 20) {
                x = viewportWidth - rect.width - 20;
            }
            if (x < 20) {
                x = 20;
            }

            // Adjust vertical position
            if (y + rect.height > viewportHeight - 20) {
                y = position.y - rect.height - 10; // Show above cursor
            }

            setAdjustedPosition({ x, y });
        }
    }, [position]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="fixed z-50 w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    left: `${adjustedPosition.x}px`,
                    top: `${adjustedPosition.y}px`,
                }}
            >
                {/* Header */}
                <div className={`${SEVERITY_COLORS[suggestion.severity]} px-4 py-2 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <span className="text-white text-lg">{CATEGORY_ICONS[suggestion.category]}</span>
                        <span className="text-white text-sm font-semibold uppercase tracking-wide">
                            {suggestion.category}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                        title="Close (Esc)"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Message */}
                    <p className="text-sm text-gray-800 leading-relaxed">
                        {suggestion.message}
                    </p>

                    {/* Original Text */}
                    {suggestion.originalText && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-700 mb-1 font-medium">Original:</p>
                            <p className="text-sm text-gray-700 line-through">
                                {suggestion.originalText}
                            </p>
                        </div>
                    )}

                    {/* Suggested Replacement */}
                    {suggestion.suggestion && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs text-green-700 mb-1 font-medium">Suggested:</p>
                            <p className="text-sm text-gray-900 font-medium">
                                {suggestion.suggestion}
                            </p>
                        </div>
                    )}

                    {/* Location */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        Line {suggestion.line}, Column {suggestion.column}
                    </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-gray-50 flex gap-2">
                    <button
                        onClick={onAccept}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm shadow-sm"
                    >
                        ✓ Accept
                    </button>
                    <button
                        onClick={onReject}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm shadow-sm"
                    >
                        ✕ Dismiss
                    </button>
                </div>

                {/* Keyboard Hint */}
                <div className="px-4 py-2 bg-gray-100 text-xs text-gray-600 text-center border-t border-gray-200">
                    Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Esc</kbd> to close
                </div>
            </div>
        </>
    );
}

/**
 * Inline marker component for highlighting issues in the editor
 */
interface InlineMarkerProps {
    severity: 'error' | 'warning' | 'info';
    onClick: () => void;
}

export function InlineMarker({ severity, onClick }: InlineMarkerProps) {
    const colors = {
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    return (
        <button
            onClick={onClick}
            className={`inline-block w-1.5 h-1.5 rounded-full ${colors[severity]} cursor-pointer hover:scale-150 transition-transform`}
            title="Click to see suggestion"
        />
    );
}
