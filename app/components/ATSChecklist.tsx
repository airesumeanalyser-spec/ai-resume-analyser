/**
 * ATS Checklist Component
 * Real-time compliance checklist for ATS optimization
 */

import { CheckCircle, XCircle, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    status: 'passed' | 'failed' | 'warning' | 'pending';
    category: 'required' | 'recommended' | 'optional';
    helpText?: string;
    autoFixAvailable?: boolean;
}

interface ATSChecklistProps {
    items: ChecklistItem[];
    onAutoFix?: (itemId: string) => void;
    overallScore?: number;
}

const STATUS_CONFIG = {
    passed: {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        label: 'Passed',
    },
    failed: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Failed',
    },
    warning: {
        icon: AlertCircle,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        label: 'Warning',
    },
    pending: {
        icon: HelpCircle,
        color: 'text-gray-400',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        label: 'Not Checked',
    },
};

const CATEGORY_CONFIG = {
    required: {
        label: 'Required',
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: '🚨',
    },
    recommended: {
        label: 'Recommended',
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        icon: '⚡',
    },
    optional: {
        label: 'Optional',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: '💡',
    },
};

export function ATSChecklist({ items, onAutoFix, overallScore }: ATSChecklistProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['required', 'recommended'])
    );
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Group items by category
    const groupedItems = {
        required: items.filter(item => item.category === 'required'),
        recommended: items.filter(item => item.category === 'recommended'),
        optional: items.filter(item => item.category === 'optional'),
    };

    // Calculate stats
    const totalItems = items.length;
    const passedItems = items.filter(i => i.status === 'passed').length;
    const failedItems = items.filter(i => i.status === 'failed').length;
    const warningItems = items.filter(i => i.status === 'warning').length;
    const completionRate = totalItems > 0 ? (passedItems / totalItems) * 100 : 0;

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const toggleItem = (itemId: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const renderItem = (item: ChecklistItem) => {
        const config = STATUS_CONFIG[item.status];
        const Icon = config.icon;
        const isExpanded = expandedItems.has(item.id);

        return (
            <div
                key={item.id}
                className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden transition-all`}
            >
                <div 
                    className="p-3 cursor-pointer hover:opacity-80"
                    onClick={() => toggleItem(item.id)}
                >
                    <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                                <div className="flex items-center gap-2">
                                    {item.autoFixAvailable && item.status !== 'passed' && onAutoFix && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAutoFix(item.id);
                                            }}
                                            className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                            Auto-Fix
                                        </button>
                                    )}
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        </div>
                    </div>
                </div>

                {/* Expanded Help Text */}
                {isExpanded && item.helpText && (
                    <div className="px-3 pb-3 pt-0">
                        <div className="bg-white rounded p-3 text-xs text-gray-700 border border-gray-200">
                            <p className="font-medium mb-1">💡 How to fix:</p>
                            <p>{item.helpText}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCategory = (category: keyof typeof groupedItems) => {
        const categoryItems = groupedItems[category];
        if (categoryItems.length === 0) return null;

        const categoryConfig = CATEGORY_CONFIG[category];
        const isExpanded = expandedCategories.has(category);
        const categoryPassed = categoryItems.filter(i => i.status === 'passed').length;
        const categoryTotal = categoryItems.length;

        return (
            <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Category Header */}
                <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">{categoryConfig.icon}</span>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 text-sm">
                                {categoryConfig.label}
                            </h3>
                            <p className="text-xs text-gray-600">
                                {categoryPassed} of {categoryTotal} passed
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                                {Math.round((categoryPassed / categoryTotal) * 100)}%
                            </div>
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </button>

                {/* Category Items */}
                {isExpanded && (
                    <div className="p-4 space-y-2 bg-white">
                        {categoryItems.map(renderItem)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            {completionRate === 100 ? (
                                <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">ATS Compliance</h3>
                            <p className="text-sm text-white/80">
                                {passedItems} of {totalItems} checks passed
                            </p>
                        </div>
                    </div>
                    
                    {overallScore !== undefined && (
                        <div className="text-right">
                            <div className={`text-3xl font-bold text-white`}>
                                {overallScore}%
                            </div>
                            <div className="text-xs text-white/80">ATS Score</div>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full bg-white transition-all duration-500 rounded-full"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{passedItems}</div>
                        <div className="text-xs text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{warningItems}</div>
                        <div className="text-xs text-gray-600">Warnings</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{failedItems}</div>
                        <div className="text-xs text-gray-600">Failed</div>
                    </div>
                </div>
            </div>

            {/* Checklist Items by Category */}
            <div className="p-6 space-y-3">
                {renderCategory('required')}
                {renderCategory('recommended')}
                {renderCategory('optional')}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="text-xs text-gray-600 text-center">
                    {completionRate === 100 ? (
                        <span className="text-green-600 font-medium flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Your resume is ATS-optimized!
                        </span>
                    ) : (
                        <span>
                            💡 Fix {failedItems + warningItems} remaining issue{failedItems + warningItems !== 1 ? 's' : ''} to optimize for ATS
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
