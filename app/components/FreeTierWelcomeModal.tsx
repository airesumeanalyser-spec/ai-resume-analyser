/**
 * Free Tier Welcome Modal
 * 
 * Displays a welcome popup for newly logged-in users informing them
 * about free tier benefits and encouraging plan upgrades.
 * 
 * Features:
 * - Auto-displays on first login (sessionStorage check)
 * - Shows free trial days remaining
 * - Call-to-action button to explore pricing
 * - Dismissible with X button
 * - Animated entrance
 * - Responsive design
 * 
 * Props:
 * - isOpen: boolean - Controls visibility
 * - onClose: () => void - Close handler
 * - onExplorePricing: () => void - Navigate to pricing handler
 * - freeTrialDaysRemaining: number - Days left in trial
 */

import { useState, useEffect } from 'react';
import { X, Zap, Clock, FileText } from 'lucide-react';

interface FreeTierWelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExplorePricing: () => void;
    freeTrialDaysRemaining?: number;
}

export default function FreeTierWelcomeModal({
    isOpen,
    onClose,
    onExplorePricing,
    freeTrialDaysRemaining = 14,
}: FreeTierWelcomeModalProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay to trigger animation
            const timer = setTimeout(() => setIsAnimating(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
                    isAnimating ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 z-50 transition-all duration-300 ${
                    isAnimating
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95'
                }`}
            >
                {/* Header with Close Button */}
                <div className="relative p-6 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                            <Zap className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Welcome!
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        You're on the free tier
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Free Trial Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {freeTrialDaysRemaining} Days Free Trial
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Enjoy full access to premium features for{' '}
                                    <span className="font-semibold">
                                        {freeTrialDaysRemaining} days
                                    </span>
                                    . Upgrade anytime to continue after trial ends.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-900">
                            During your free trial, you get:
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                                <span>ATS Score Analysis</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                                <span>AI-Powered Feedback</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                                <span>Keyword Optimization</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                                <span>Resume Improvement Tips</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                                <span>PDF Export</span>
                            </li>
                        </ul>
                    </div>

                    {/* Upsell Message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-900">
                            <span className="font-semibold">💡 Tip:</span> Check
                            out our premium plans for unlimited resumes, priority
                            support, and more!
                        </p>
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={onExplorePricing}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                        Explore Pricing
                    </button>
                </div>
            </div>
        </>
    );
}
