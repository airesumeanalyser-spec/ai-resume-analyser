import React from 'react';
import { useApiStore } from '~/lib/api';

interface TrialTrackerProps {
    className?: string;
    showUpgradeLink?: boolean;
}

/**
 * Real-time Free Trial Tracker Component
 * 
 * Displays the current trial usage (X/3 uses) with visual indicator.
 * Updates automatically when trial is consumed.
 */
export default function TrialTracker({ className = '', showUpgradeLink = true }: TrialTrackerProps) {
    const { trial, auth } = useApiStore();

    // Don't show if not authenticated
    if (!auth.isAuthenticated) {
        return null;
    }

    const { used, remaining, max } = trial;
    const percentUsed = (used / max) * 100;
    
    // Determine color based on usage
    const getColorClass = () => {
        if (remaining === 0) return 'text-red-600 bg-red-50 border-red-200';
        if (remaining === 1) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    const getProgressColor = () => {
        if (remaining === 0) return 'bg-red-500';
        if (remaining === 1) return 'bg-orange-500';
        return 'bg-green-500';
    };

    return (
        <div className={`rounded-lg border p-3 ${getColorClass()} ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Free Trial</span>
                <span className="text-sm font-bold">
                    {used}/{max} used
                </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${percentUsed}%` }}
                />
            </div>
            
            {/* Status message */}
            <div className="mt-2 text-xs">
                {remaining === 0 ? (
                    <span className="text-red-600 font-medium">
                        Trial exhausted. Upgrade to continue analyzing resumes.
                    </span>
                ) : remaining === 1 ? (
                    <span className="text-orange-600">
                        Only 1 analysis remaining!
                    </span>
                ) : (
                    <span>
                        {remaining} free {remaining === 1 ? 'analysis' : 'analyses'} remaining
                    </span>
                )}
            </div>
            
            {/* Upgrade link */}
            {showUpgradeLink && remaining <= 1 && (
                <a 
                    href="/plans" 
                    className="mt-2 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                    View Plans →
                </a>
            )}
        </div>
    );
}
