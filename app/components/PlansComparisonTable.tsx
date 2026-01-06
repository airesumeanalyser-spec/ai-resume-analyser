/**
 * Plans Comparison Table Component
 * 
 * Detailed side-by-side comparison of all plans showing:
 * - Features and capabilities
 * - Pricing
 * - Support levels
 * - CTA buttons
 * 
 * Features:
 * - Responsive table layout
 * - Highlight featured plan
 * - Show current plan
 * - Easy feature comparison
 */

import React from 'react';
import { PlanType, getPlanDetails } from '~/lib/razorpay';
import { Check, X, Crown } from 'lucide-react';

/**
 * Props for PlansComparisonTable
 */
interface PlansComparisonTableProps {
    /**
     * User's current plan
     */
    currentPlan?: PlanType;

    /**
     * Callback when user selects a plan
     */
    onSelectPlan: (plan: PlanType) => void;
}

/**
 * Feature comparison data
 */
const COMPARISON_FEATURES = [
    { category: 'Resumes', items: ['Resumes Analyzable', 'AI Suggestions', 'Version History'] },
    {
        category: 'Features',
        items: [
            'ATS Score',
            'Keyword Analysis',
            'Interview Prep',
            'Mock Interviews',
            'Cover Letter Help',
        ],
    },
    { category: 'Support', items: ['Email Support', 'Priority Support', '24/7 Support'] },
    {
        category: 'Exports',
        items: ['PDF Export', 'Multiple Formats', 'Batch Processing'],
    },
];

/**
 * Feature availability by plan
 */
const FEATURE_AVAILABILITY: Record<PlanType, Record<string, boolean>> = {
    [PlanType.BASIC]: {
        'Resumes Analyzable': true,
        'AI Suggestions': false,
        'Version History': false,
        'ATS Score': true,
        'Keyword Analysis': true,
        'Interview Prep': false,
        'Mock Interviews': false,
        'Cover Letter Help': false,
        'Email Support': true,
        'Priority Support': false,
        '24/7 Support': false,
        'PDF Export': true,
        'Multiple Formats': false,
        'Batch Processing': false,
    },
    [PlanType.PREMIUM]: {
        'Resumes Analyzable': true,
        'AI Suggestions': true,
        'Version History': true,
        'ATS Score': true,
        'Keyword Analysis': true,
        'Interview Prep': true,
        'Mock Interviews': true,
        'Cover Letter Help': false,
        'Email Support': true,
        'Priority Support': true,
        '24/7 Support': false,
        'PDF Export': true,
        'Multiple Formats': true,
        'Batch Processing': false,
    },
    [PlanType.ENTERPRISE]: {
        'Resumes Analyzable': true,
        'AI Suggestions': true,
        'Version History': true,
        'ATS Score': true,
        'Keyword Analysis': true,
        'Interview Prep': true,
        'Mock Interviews': true,
        'Cover Letter Help': true,
        'Email Support': true,
        'Priority Support': true,
        '24/7 Support': true,
        'PDF Export': true,
        'Multiple Formats': true,
        'Batch Processing': true,
    },
};

/**
 * PlansComparisonTable Component
 */
export default function PlansComparisonTable({
    currentPlan,
    onSelectPlan,
}: PlansComparisonTableProps) {
    const plans = Object.values(PlanType);

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Feature
                            </th>
                            {plans.map((plan) => (
                                <th key={plan} className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="capitalize font-semibold text-gray-900">
                                            {plan}
                                        </div>
                                        {plan === PlanType.PREMIUM && (
                                            <Crown className="w-4 h-4 text-indigo-600" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Pricing Row */}
                        <tr className="border-b border-gray-200 bg-indigo-50">
                            <td className="px-6 py-4 font-semibold text-gray-900">
                                Monthly Price
                            </td>
                            {plans.map((plan) => (
                                <td key={plan} className="px-6 py-4 text-center">
                                    <div className="text-2xl font-bold text-indigo-600">
                                        {getPlanDetails(plan).formattedAmount}
                                    </div>
                                </td>
                            ))}
                        </tr>

                        {/* Features */}
                        {COMPARISON_FEATURES.map((section, sectionIdx) => (
                            <React.Fragment key={section.category}>
                                {/* Category Header */}
                                <tr className="bg-gray-100 border-t-2 border-gray-200">
                                    <td
                                        colSpan={plans.length + 1}
                                        className="px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider"
                                    >
                                        {section.category}
                                    </td>
                                </tr>

                                {/* Features in Category */}
                                {section.items.map((feature, featureIdx) => (
                                    <tr
                                        key={feature}
                                        className={`border-b border-gray-200 ${
                                            featureIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        } hover:bg-indigo-50 transition-colors`}
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {feature}
                                        </td>
                                        {plans.map((plan) => (
                                            <td
                                                key={`${plan}-${feature}`}
                                                className="px-6 py-4 text-center"
                                            >
                                                {FEATURE_AVAILABILITY[plan][feature] ? (
                                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}

                        {/* CTA Row */}
                        <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                            <td className="px-6 py-6"></td>
                            {plans.map((plan) => (
                                <td key={plan} className="px-6 py-6 text-center">
                                    <button
                                        onClick={() => onSelectPlan(plan)}
                                        disabled={currentPlan === plan}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                            currentPlan === plan
                                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                : plan === PlanType.PREMIUM
                                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                                                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                        }`}
                                    >
                                        {currentPlan === plan ? 'Current' : 'Select'}
                                    </button>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Mobile Comparison */}
            <div className="lg:hidden">
                {plans.map((plan) => (
                    <div key={plan} className="border-b border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 capitalize">
                                {plan}
                            </h3>
                            {plan === PlanType.PREMIUM && (
                                <Crown className="w-5 h-5 text-indigo-600" />
                            )}
                        </div>

                        <div className="text-3xl font-bold text-indigo-600 mb-4">
                            {getPlanDetails(plan).formattedAmount}
                        </div>

                        <div className="space-y-3 mb-6">
                            {COMPARISON_FEATURES.map((section) => (
                                <div key={section.category}>
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                        {section.category}
                                    </p>
                                    <ul className="space-y-2">
                                        {section.items.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                {FEATURE_AVAILABILITY[plan][feature] ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <X className="w-4 h-4 text-gray-300" />
                                                )}
                                                <span
                                                    className={
                                                        FEATURE_AVAILABILITY[plan][
                                                            feature
                                                        ]
                                                            ? 'text-gray-900'
                                                            : 'text-gray-400'
                                                    }
                                                >
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => onSelectPlan(plan)}
                            disabled={currentPlan === plan}
                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                                currentPlan === plan
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : plan === PlanType.PREMIUM
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            }`}
                        >
                            {currentPlan === plan ? 'Current Plan' : 'Choose Plan'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
