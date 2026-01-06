/**
 * Free Tier Information Component
 * 
 * Displays free tier benefits and limitations
 * with comparison to paid plans
 * 
 * Features:
 * - Shows what's included in free tier
 * - Highlights key differences from paid plans
 * - Motivates users to upgrade
 * - Clear feature comparison
 */

import { Check, X } from 'lucide-react';
import { PlanType, getPlanDetails } from '~/lib/razorpay';

interface FreeTierInfoProps {
    freeTrialDaysRemaining?: number;
    onUpgradeClick?: () => void;
}

export default function FreeTierInfo({
    freeTrialDaysRemaining = 14,
    onUpgradeClick,
}: FreeTierInfoProps) {
    const freeTierFeatures = [
        'Up to 3 Resume Uploads',
        'ATS Score Analysis',
        'Basic AI Feedback',
        'Simple Recommendations',
        'Email Support',
        'Resume Templates',
    ];

    const premiumPlan = getPlanDetails(PlanType.PREMIUM);

    return (
        <div className="space-y-6">
            {/* Free Tier Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Free Tier
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {freeTrialDaysRemaining} days of free trial remaining
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full">
                        Current Plan
                    </span>
                </div>

                {/* Free Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {freeTierFeatures.map((feature) => (
                        <div
                            key={feature}
                            className="flex items-center gap-2 text-sm text-gray-700"
                        >
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>

                {/* Upgrade CTA */}
                <button
                    onClick={onUpgradeClick}
                    className="mt-6 w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm"
                >
                    Upgrade Now
                </button>
            </div>

            {/* What You'll Get When You Upgrade */}
            <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    What you'll unlock by upgrading:
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{premiumPlan.displayName}</p>
                                <p className="text-sm opacity-90">
                                    ₹{(premiumPlan.amount / 100).toFixed(0)}/month
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 space-y-2">
                        {premiumPlan.features?.slice(0, 6).map((feature) => (
                            <div
                                key={feature}
                                className="flex items-start gap-2 text-sm text-gray-700"
                            >
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </div>
                        ))}
                        <button
                            onClick={onUpgradeClick}
                            className="mt-4 w-full text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors p-2 -mx-2 hover:bg-indigo-50 rounded"
                        >
                            View All Features →
                        </button>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">
                    Frequently Asked Questions
                </h4>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="font-medium text-gray-900">
                            What happens after my free trial ends?
                        </p>
                        <p className="text-gray-600 mt-1">
                            After {freeTrialDaysRemaining} days, you'll need to upgrade to a paid
                            plan to continue using premium features. You can
                            still access your saved resumes.
                        </p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-900">
                            Can I cancel anytime?
                        </p>
                        <p className="text-gray-600 mt-1">
                            Yes! You can cancel your subscription at any time
                            with no penalties. Your data will be preserved.
                        </p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-900">
                            Is there a money-back guarantee?
                        </p>
                        <p className="text-gray-600 mt-1">
                            Absolutely! If you're not satisfied within 7 days,
                            we'll refund 100% of your payment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
