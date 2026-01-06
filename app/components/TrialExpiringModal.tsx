/**
 * Trial Expiring Modal
 * 
 * Modal popup that shows when user's free trial is about to expire.
 * Can be triggered from anywhere in the app.
 * 
 * Features:
 * - Animated appearance
 * - Clear CTA to upgrade
 * - Dismiss option
 * - Trial countdown
 * - Plan comparison at a glance
 * 
 * Usage:
 * ```tsx
 * const [showTrialModal, setShowTrialModal] = useState(false);
 * 
 * <TrialExpiringModal
 *   isOpen={showTrialModal}
 *   daysRemaining={3}
 *   onUpgrade={() => navigate('/plans')}
 *   onDismiss={() => setShowTrialModal(false)}
 * />
 * ```
 */

import { X, Clock } from 'lucide-react';

/**
 * Props for TrialExpiringModal
 */
interface TrialExpiringModalProps {
    /**
     * Whether the modal is open
     */
    isOpen: boolean;

    /**
     * Days remaining in trial
     */
    daysRemaining: number;

    /**
     * Callback when user clicks upgrade
     */
    onUpgrade: () => void;

    /**
     * Callback when user dismisses the modal
     */
    onDismiss: () => void;
}

/**
 * TrialExpiringModal Component
 */
export default function TrialExpiringModal({
    isOpen,
    daysRemaining,
    onUpgrade,
    onDismiss,
}: TrialExpiringModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in scale-in duration-200 origin-center">
                {/* Close Button */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
                        <Clock className="w-8 h-8 text-yellow-600 animate-pulse" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Trial Ending Soon
                    </h2>

                    {/* Days Countdown */}
                    <div className="mb-6">
                        <p className="text-gray-600 mb-2">Your free trial ends in</p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="text-5xl font-bold text-yellow-600">
                                {daysRemaining}
                            </div>
                            <div className="text-left">
                                <p className="text-lg text-gray-900">
                                    Day{daysRemaining !== 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-gray-600">remaining</p>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="text-gray-600 mb-8">
                        Upgrade now to continue using all premium features including AI
                        suggestions, multiple resumes, and priority support.
                    </p>

                    {/* Features Preview */}
                    <div className="bg-indigo-50 rounded-lg p-4 mb-8 text-left">
                        <p className="text-sm font-semibold text-gray-900 mb-3">
                            Unlock with Premium:
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2 text-gray-700">
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                Unlimited resume analysis
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                AI-powered suggestions
                            </li>
                            <li className="flex items-center gap-2 text-gray-700">
                                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                Priority customer support
                            </li>
                        </ul>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={onUpgrade}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Upgrade to Premium
                        </button>
                        <button
                            onClick={onDismiss}
                            className="w-full px-6 py-2 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>

                    {/* Guarantee */}
                    <p className="text-xs text-gray-600 mt-6">
                        💳 7-day money-back guarantee. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
}
