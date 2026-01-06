/**
 * Inline Suggestions Component
 * Displays AI-powered suggestions with accept/reject actions
 */

import { useState } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, Lightbulb, FileText, Palette } from 'lucide-react';

export interface Suggestion {
    id: string;
    line: number;
    column: number;
    length: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
    category: 'ats' | 'content' | 'formatting' | 'grammar';
    originalText?: string;
}

interface InlineSuggestionsProps {
    suggestions: Suggestion[];
    onAccept: (id: string, replacement: string) => void;
    onReject: (id: string) => void;
    onJumpToLine?: (line: number) => void;
}

const SEVERITY_CONFIG = {
    error: {
        border: 'border-red-500',
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: AlertCircle,
        label: 'Must Fix',
    },
    warning: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        icon: AlertCircle,
        label: 'Should Fix',
    },
    info: {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: Info,
        label: 'Suggestion',
    },
};

const CATEGORY_CONFIG = {
    ats: {
        icon: '🎯',
        label: 'ATS Optimization',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    content: {
        icon: '📝',
        label: 'Content Quality',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    formatting: {
        icon: '🎨',
        label: 'Formatting',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    grammar: {
        icon: '✍️',
        label: 'Grammar & Style',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
};

export function InlineSuggestions({
    suggestions,
    onAccept,
    onReject,
    onJumpToLine,
}: InlineSuggestionsProps) {
    const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
    const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

    // Group suggestions by severity
    const groupedSuggestions = {
        error: suggestions.filter(s => s.severity === 'error'),
        warning: suggestions.filter(s => s.severity === 'warning'),
        info: suggestions.filter(s => s.severity === 'info'),
    };

    const toggleExpand = (id: string) => {
        setExpandedSuggestions(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const renderSuggestion = (suggestion: Suggestion) => {
        const severityConfig = SEVERITY_CONFIG[suggestion.severity];
        const categoryConfig = CATEGORY_CONFIG[suggestion.category];
        const SeverityIcon = severityConfig.icon;
        const isExpanded = expandedSuggestions.has(suggestion.id);
        const isActive = activeSuggestion === suggestion.id;

        return (
            <div
                key={suggestion.id}
                className={`border-l-4 rounded-lg transition-all ${
                    severityConfig.border
                } ${severityConfig.bg} ${
                    isActive ? 'shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'
                }`}
                onMouseEnter={() => setActiveSuggestion(suggestion.id)}
                onMouseLeave={() => setActiveSuggestion(null)}
            >
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                            <SeverityIcon className={`w-5 h-5 mt-0.5 ${severityConfig.text}`} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{categoryConfig.icon}</span>
                                    <span className={`text-xs font-semibold uppercase tracking-wide ${categoryConfig.color}`}>
                                        {categoryConfig.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig.text} ${severityConfig.bg}`}>
                                        {severityConfig.label}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {suggestion.message}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                            <button
                                onClick={() => onAccept(suggestion.id, suggestion.suggestion)}
                                className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all hover:scale-110 shadow-sm"
                                title="Accept suggestion"
                            >
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onReject(suggestion.id)}
                                className="p-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-all hover:scale-110 shadow-sm"
                                title="Dismiss suggestion"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Original Text (if provided) */}
                    {suggestion.originalText && (
                        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-500 uppercase">Original</span>
                                {onJumpToLine && (
                                    <button
                                        onClick={() => onJumpToLine(suggestion.line)}
                                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        Line {suggestion.line}
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 line-through">
                                {suggestion.originalText}
                            </p>
                        </div>
                    )}

                    {/* Suggested Replacement */}
                    {suggestion.suggestion && (
                        <div className="p-3 bg-white rounded-lg border-2 border-green-300 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <Lightbulb className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700 uppercase">Suggested</span>
                            </div>
                            <p className="text-sm text-gray-900 font-medium">
                                {suggestion.suggestion}
                            </p>
                        </div>
                    )}

                    {/* Expand for more details */}
                    {suggestion.originalText && (
                        <button
                            onClick={() => toggleExpand(suggestion.id)}
                            className="mt-3 text-xs text-gray-600 hover:text-gray-900 hover:underline"
                        >
                            {isExpanded ? 'Hide details' : 'Show more details'}
                        </button>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                            <p><strong>Line:</strong> {suggestion.line}, Column: {suggestion.column}</p>
                            <p><strong>Category:</strong> {categoryConfig.label}</p>
                            <p><strong>Severity:</strong> {severityConfig.label}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (suggestions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-sm text-gray-600">No suggestions at this time. Your resume looks great!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                {Object.entries(groupedSuggestions).map(([severity, items]) => {
                    const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
                    const Icon = config.icon;
                    
                    return (
                        <div
                            key={severity}
                            className={`p-4 rounded-lg ${config.bg} border ${config.border}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${config.text}`} />
                                <span className={`text-xs font-semibold uppercase ${config.text}`}>
                                    {config.label}
                                </span>
                            </div>
                            <p className={`text-2xl font-bold ${config.text}`}>{items.length}</p>
                        </div>
                    );
                })}
            </div>

            {/* Errors First */}
            {groupedSuggestions.error.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Critical Issues ({groupedSuggestions.error.length})
                    </h3>
                    {groupedSuggestions.error.map(renderSuggestion)}
                </div>
            )}

            {/* Warnings */}
            {groupedSuggestions.warning.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Warnings ({groupedSuggestions.warning.length})
                    </h3>
                    {groupedSuggestions.warning.map(renderSuggestion)}
                </div>
            )}

            {/* Info/Suggestions */}
            {groupedSuggestions.info.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Suggestions ({groupedSuggestions.info.length})
                    </h3>
                    {groupedSuggestions.info.map(renderSuggestion)}
                </div>
            )}
        </div>
    );
}
