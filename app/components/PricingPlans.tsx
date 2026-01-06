/**
 * Pricing Plans Component
 * 
 * Displays pricing plans in a minimal card format suitable for
 * the home page or marketing sections. Can be clicked to open
 * the full payment gateway.
 * 
 * TODO: Customize pricing and features based on your strategy
 */

import { useState } from 'react';
import { PlanType, getPlanDetails } from '~/lib/razorpay';
import PaymentGateway from './PaymentGateway';
import { Check, X } from 'lucide-react';

/**
 * Props for PricingPlans component
 */
interface PricingPlansProps {
    /**
     * Whether the modal is open
     */
    isOpen?: boolean;

    /**
     * Callback when modal should close
     */
    onClose?: () => void;

    /**
     * User information for payment
     */
    userInfo?: {
        name?: string;
        email?: string;
        phone?: string;
    };

    /**
     * Callback on successful payment
     */
    onSuccess?: (plan: PlanType) => void;
}

/**
 * Minimal pricing card for display
 */
function MinimalPricingCard({
    planType,
    onClick,
}: {
    planType: PlanType;
    onClick: () => void;
}) {
    const plan = getPlanDetails(planType);

    return (
        <button
            onClick={onClick}
            className="text-left p-6 bg-white rounded-lg border border-gray-200 hover:border-indigo-600 hover:shadow-lg transition-all"
        >
            <h3 className="text-lg font-bold text-gray-900 capitalize mb-2">
                {planType}
            </h3>
            <div className="text-2xl font-bold text-indigo-600 mb-4">
                {plan.formattedAmount}
            </div>
            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
            <button className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold">
                View Features
            </button>
        </button>
    );
}

/**
 * Main PricingPlans Component
 * 
 * Usage:
 * ```tsx
 * const [showPricing, setShowPricing] = useState(false);
 * 
 * <PricingPlans
 *   isOpen={showPricing}
 *   onClose={() => setShowPricing(false)}
 *   onSuccess={(plan) => {
 *     console.log('Purchased:', plan);
 *     setShowPricing(false);
 *   }}
 * />
 * ```
 */
export default function PricingPlans({
    isOpen = false,
    onClose,
    userInfo,
    onSuccess,
}: PricingPlansProps) {
    const [showFullPayment, setShowFullPayment] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Choose Your Plan
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!showFullPayment ? (
                        <>
                            {/* Simple plan cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {Object.values(PlanType).map(planType => (
                                    <MinimalPricingCard
                                        key={planType}
                                        planType={planType}
                                        onClick={() => setShowFullPayment(true)}
                                    />
                                ))}
                            </div>

                            {/* Quick comparison */}
                            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-gray-900 mb-4">
                                    What's included in each plan?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {Object.values(PlanType).map(planType => {
                                        const plan = getPlanDetails(planType);
                                        return (
                                            <div key={planType}>
                                                <h4 className="font-semibold text-gray-900 capitalize mb-3">
                                                    {planType} Includes:
                                                </h4>
                                                <ul className="space-y-2">
                                                    {plan.features.map(
                                                        (
                                                            feature: string,
                                                            index: number
                                                        ) => (
                                                            <li
                                                                key={index}
                                                                className="flex items-start text-sm text-gray-700"
                                                            >
                                                                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                                                {feature}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Full payment gateway */}
                            <PaymentGateway
                                userInfo={userInfo}
                                onPaymentSuccess={plan => {
                                    onSuccess?.(plan);
                                    setShowFullPayment(false);
                                    onClose?.();
                                }}
                                showComparison={false}
                            />
                            <button
                                onClick={() => setShowFullPayment(false)}
                                className="mt-4 w-full py-2 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                            >
                                ← Back to Plans
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
