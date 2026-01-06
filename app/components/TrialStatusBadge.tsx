/**
 * Trial Status Badge Component
 * 
 * Displays free trial status with:
 * - Days remaining
 * - Progress bar
 * - Urgency indicators (warning when days are low)
 * - Call-to-action for upgrading
 * 
 * Features:
 * - Visual progress indicator
 * - Color coding (green → yellow → red)
 * - Responsive design
 * - Mobile-friendly
 */

import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Props for TrialStatusBadge
 */
interface TrialStatusBadgeProps {
    /**
     * Number of days remaining in free trial
     */
    daysRemaining: number;

    /**
     * Total number of trial days
     */
    totalDays?: number;

    /**
     * Callback to upgrade plan
     */
    onUpgrade?: () => void;
}

/**
 * TrialStatusBadge Component
 */
export default function TrialStatusBadge({
    daysRemaining,
    totalDays = 14,
    onUpgrade,
}: TrialStatusBadgeProps) {
    const percentRemaining = (daysRemaining / totalDays) * 100;
    const isLowOnTime = daysRemaining <= 3;
    const isExpired = daysRemaining <= 0;

    // Determine color scheme based on remaining days
    const getColorScheme = () => {
        if (isExpired) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', progress: 'bg-red-500' };
        if (isLowOnTime) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', progress: 'bg-yellow-500' };
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', progress: 'bg-green-500' };
    };

    const colors = getColorScheme();

    if (isExpired) {
        return (
            <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className={`w-6 h-6 ${colors.text}`} />
                        <div>
                            <p className={`font-semibold ${colors.text}`}>Trial Expired</p>
                            <p className="text-sm opacity-75">
                                Upgrade now to continue using premium features
                            </p>
                        </div>
                    </div>
                    {onUpgrade && (
                        <button
                            onClick={onUpgrade}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap ml-4"
                        >
                            Upgrade Now
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-4`}>
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isLowOnTime ? (
                            <AlertCircle className={`w-5 h-5 ${colors.text}`} />
                        ) : (
                            <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                        )}
                        <h3 className={`font-semibold ${colors.text}`}>
                            Free Trial Active
                        </h3>
                    </div>
                    <span className={`text-lg font-bold ${colors.text}`}>
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full ${colors.progress} transition-all duration-300`}
                        style={{ width: `${percentRemaining}%` }}
                    />
                </div>

                {/* Message */}
                <div className="flex items-center justify-between">
                    <p className="text-sm opacity-75">
                        You have access to all{' '}
                        <span className="font-semibold">Premium features</span> during
                        your trial
                    </p>
                    {isLowOnTime && onUpgrade && (
                        <button
                            onClick={onUpgrade}
                            className="px-4 py-1 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap ml-4"
                        >
                            Upgrade Plan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
