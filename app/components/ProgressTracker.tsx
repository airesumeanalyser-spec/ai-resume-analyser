/**
 * Progress Tracker Component
 * Visual progress indicator showing resume completion status
 */

import { CheckCircle, Circle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export interface ProgressStep {
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'pending' | 'error';
    score?: number;
    requiredForATS?: boolean;
}

interface ProgressTrackerProps {
    steps: ProgressStep[];
    currentStep: string;
    overallScore?: number;
    onStepClick?: (stepId: string) => void;
}

export function ProgressTracker({ 
    steps, 
    currentStep, 
    overallScore,
    onStepClick 
}: ProgressTrackerProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    
    const completedCount = steps.filter((s) => s.status === 'completed').length;
    const errorCount = steps.filter((s) => s.status === 'error').length;
    const progress = (completedCount / steps.length) * 100;

    // Calculate overall status color
    const getProgressColor = () => {
        if (errorCount > 0) return 'from-red-500 to-red-600';
        if (progress === 100) return 'from-green-500 to-green-600';
        if (progress >= 50) return 'from-blue-500 to-purple-600';
        return 'from-gray-400 to-gray-500';
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div 
                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            {progress === 100 ? (
                                <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Resume Progress</h3>
                            <p className="text-sm text-white/80">
                                {completedCount} of {steps.length} steps completed
                            </p>
                        </div>
                    </div>
                    
                    {overallScore !== undefined && (
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">{overallScore}%</div>
                            <div className="text-xs text-white/80">ATS Score</div>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                        <div
                            className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 rounded-full`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-white/80">
                        <span>{Math.round(progress)}% Complete</span>
                        {errorCount > 0 && (
                            <span className="text-red-200 font-medium">
                                {errorCount} issue{errorCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Steps List */}
            {isExpanded && (
                <div className="p-6 space-y-3">
                    {steps.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isClickable = onStepClick && (step.status === 'completed' || isActive);
                        
                        return (
                            <div
                                key={step.id}
                                onClick={() => isClickable && onStepClick(step.id)}
                                className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                                    isActive 
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500 shadow-md' 
                                        : step.status === 'completed'
                                        ? 'bg-green-50 border border-green-200 hover:shadow-md'
                                        : step.status === 'error'
                                        ? 'bg-red-50 border border-red-200'
                                        : 'border border-gray-200 hover:border-gray-300'
                                } ${isClickable ? 'cursor-pointer' : ''}`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0 mt-1">
                                    {step.status === 'completed' && (
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    {step.status === 'error' && (
                                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                                            <AlertCircle className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    {step.status === 'current' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                                            <div className="w-4 h-4 rounded-full bg-white" />
                                        </div>
                                    )}
                                    {step.status === 'pending' && (
                                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                                            <Circle className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Step Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900">
                                                {index + 1}. {step.title}
                                            </h4>
                                            {step.requiredForATS && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        {step.score !== undefined && (
                                            <div className={`px-3 py-1 rounded-full ${getScoreBgColor(step.score)}`}>
                                                <span className={`text-sm font-bold ${getScoreColor(step.score)}`}>
                                                    {step.score}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{step.description}</p>
                                    
                                    {/* Active Step Indicator */}
                                    {isActive && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 font-medium">
                                            <ArrowRight className="w-3 h-3" />
                                            <span>Current Step</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer Actions */}
            {isExpanded && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>
                            💡 Complete all steps for best ATS results
                        </span>
                        {progress === 100 && (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Ready to export!
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Compact Progress Bar (for header/sidebar)
 */
interface CompactProgressProps {
    progress: number;
    label?: string;
}

export function CompactProgress({ progress, label = 'Progress' }: CompactProgressProps) {
    const getColor = () => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        return 'bg-yellow-500';
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${getColor()} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
