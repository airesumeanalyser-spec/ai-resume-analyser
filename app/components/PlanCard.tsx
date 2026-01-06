/**
 * Plan Card Component
 * 
 * Individual card displaying a single plan with features, pricing,
 * and call-to-action button.
 * 
 * Features:
 * - Highlighted featured plan
 * - Current plan indicator
 * - Feature list with checkmarks
 * - Responsive design
 * - Click handler for plan selection
 */

import { PlanType, getPlanDetails } from '~/lib/razorpay';
import { Check, Crown } from 'lucide-react';

/**
 * Props for PlanCard
 */
interface PlanCardProps {
    /**
     * The plan type this card represents
     */
    planType: PlanType;

    /**
     * Whether this is the user's current plan
     */
    isCurrentPlan?: boolean;

    /**
     * Whether this plan should be highlighted as featured
     */
    isFeatured?: boolean;

    /**
     * Callback when user selects this plan
     */
    onSelectPlan: (plan: PlanType) => void;
}

/**
 * PlanCard Component
 */
export default function PlanCard({
    planType,
    isCurrentPlan = false,
    isFeatured = false,
    onSelectPlan,
}: PlanCardProps) {
    const plan = getPlanDetails(planType);

    return (
        <div
            className={`relative rounded-xl transition-all duration-300 ${
                isFeatured
                    ? 'ring-2 ring-indigo-600 shadow-2xl scale-105'
                    : 'shadow-lg hover:shadow-xl'
            } ${isFeatured ? 'bg-indigo-50' : 'bg-white'}`}
        >
            {/* Featured Badge */}
            {isFeatured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        <Crown className="w-4 h-4" />
                        Most Popular
                    </div>
                </div>
            )}

            {/* Current Plan Badge */}
            {isCurrentPlan && (
                <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        ✓ Current Plan
                    </span>
                </div>
            )}

            <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 capitalize mb-2">
                    {planType}
                </h3>

                {/* Price */}
                <div className="mb-6">
                    <div className="text-5xl font-bold text-indigo-600">
                        {plan.formattedAmount}
                    </div>
                    <p className="text-gray-600 text-sm mt-2">/month, billed monthly</p>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* CTA Button */}
                <button
                    onClick={() => onSelectPlan(planType)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 mb-8 ${
                        isCurrentPlan
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : isFeatured
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                >
                    {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
                </button>

                {/* Features List */}
                <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        What's Included
                    </p>
                    <ul className="space-y-3">
                        {plan.features && plan.features.length > 0 ? (
                            plan.features.map((feature, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 text-gray-700"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <Check className="w-5 h-5 text-green-500" />
                                    </div>
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-sm text-gray-600">
                                Standard features included
                            </li>
                        )}
                    </ul>
                </div>

                {/* Additional Info */}
                <div className="mt-8 pt-8 border-t border-gray-200 text-xs text-gray-600">
                    <p>✓ Billed monthly</p>
                    <p>✓ Cancel anytime</p>
                    <p>✓ 7-day money-back guarantee</p>
                </div>
            </div>
        </div>
    );
}
