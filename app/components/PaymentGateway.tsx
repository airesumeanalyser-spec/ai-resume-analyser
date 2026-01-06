/**
 * Payment Gateway Component
 * 
 * A comprehensive component that handles payment plan selection, checkout,
 * and payment processing using Razorpay.
 * 
 * Features:
 * - Plan selection cards
 * - Payment processing
 * - Error handling
 * - Loading states
 * - Success/failure feedback
 * 
 * TODO: Customize styling to match your app theme
 * TODO: Add more payment plans as needed
 */

import { useState } from 'react';
import { usePayment } from '~/lib/payment-hooks';
import {
    PlanType,
    getPlanDetails,
    PaymentStatus,
} from '~/lib/razorpay';
import { Check, Loader2, AlertCircle } from 'lucide-react';

/**
 * Props for the PaymentGateway component
 */
interface PaymentGatewayProps {
    /**
     * Callback when payment is successful
     * TODO: Implement database updates, feature grants, etc.
     */
    onPaymentSuccess?: (planType: PlanType) => void;

    /**
     * Callback when payment fails
     */
    onPaymentError?: (error: Error) => void;

    /**
     * Whether to show all plans or only specific ones
     */
    visiblePlans?: PlanType[];

    /**
     * User information for pre-filling checkout
     */
    userInfo?: {
        name?: string;
        email?: string;
        phone?: string;
    };

    /**
     * Show plan comparison or just selection
     */
    showComparison?: boolean;
}

/**
 * Individual plan card component
 */
function PlanCard({
    planType,
    isSelected,
    isLoading,
    onSelect,
}: {
    planType: PlanType;
    isSelected: boolean;
    isLoading: boolean;
    onSelect: () => void;
}) {
    const plan = getPlanDetails(planType);

    return (
        <div
            className={`relative flex flex-col rounded-lg border-2 transition-all p-6 ${
                isSelected
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
            }`}
        >
            {/* Plan name and price */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 capitalize mb-2">
                    {planType} Plan
                </h3>
                <div className="text-3xl font-bold text-indigo-600">
                    {plan.formattedAmount}
                    <span className="text-base text-gray-600 font-normal">/one-time</span>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

            {/* Features list */}
            <ul className="space-y-2 flex-grow mb-6">
                {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* Select button */}
            <button
                onClick={onSelect}
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    isSelected
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSelected ? 'Processing...' : 'Select Plan'}
            </button>
        </div>
    );
}

/**
 * Main Payment Gateway Component
 * 
 * Usage:
 * ```tsx
 * <PaymentGateway
 *   onPaymentSuccess={(plan) => {
 *     console.log('Payment successful for plan:', plan);
 *     // Grant premium features
 *   }}
 *   userInfo={{
 *     email: 'user@example.com',
 *     phone: '+919999999999'
 *   }}
 * />
 * ```
 */
export default function PaymentGateway({
    onPaymentSuccess,
    onPaymentError,
    visiblePlans = Object.values(PlanType),
    userInfo,
    showComparison = true,
}: PaymentGatewayProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
    const { isLoading, status, error, resetPayment, processPayment } =
        usePayment();

    /**
     * Handle plan selection and initiate payment
     */
    const handleSelectPlan = async (planType: PlanType) => {
        try {
            setSelectedPlan(planType);
            resetPayment();

            // TODO: Ensure user is authenticated before processing payment
            // const user = await getCurrentUser();
            // if (!user) {
            //     router.push('/api/auth/signin');
            //     return;
            // }

            await processPayment(planType, userInfo);

            if (status === PaymentStatus.COMPLETED) {
                onPaymentSuccess?.(planType);
                setSelectedPlan(null);
            }
        } catch (err) {
            console.error('Payment error:', err);
            onPaymentError?.(err as Error);
        }
    };

    /**
     * Render error state
     */
    if (error && selectedPlan) {
        return (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-grow">
                        <h3 className="font-bold text-red-900 mb-2">
                            Payment Failed
                        </h3>
                        <p className="text-red-800 text-sm mb-4">
                            {error.message ||
                                'An error occurred during payment. Please try again.'}
                        </p>
                        <button
                            onClick={() => {
                                setSelectedPlan(null);
                                resetPayment();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Render success state
     */
    if (status === PaymentStatus.COMPLETED && selectedPlan) {
        return (
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                    </div>
                </div>
                <h3 className="font-bold text-green-900 text-lg mb-2">
                    Payment Successful!
                </h3>
                <p className="text-green-800 text-sm mb-4">
                    Your {selectedPlan} plan has been activated. Thank you for
                    your purchase!
                </p>
                <button
                    onClick={() => {
                        setSelectedPlan(null);
                        resetPayment();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                >
                    Continue
                </button>
            </div>
        );
    }

    /**
     * Render main payment plans selection
     */
    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Choose Your Plan
                </h2>
                <p className="text-lg text-gray-600">
                    Get instant ATS insights and improvement tips for your resume
                </p>
            </div>

            {/* Razorpay Configuration Warning */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Note:</strong> Razorpay is currently in demo mode.
                        To enable real payments, configure VITE_RAZORPAY_KEY_ID in
                        your environment variables.
                    </p>
                </div>
            )}

            {/* Plan cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {visiblePlans.map(planType => (
                    <PlanCard
                        key={planType}
                        planType={planType}
                        isSelected={selectedPlan === planType}
                        isLoading={isLoading && selectedPlan === planType}
                        onSelect={() => handleSelectPlan(planType)}
                    />
                ))}
            </div>

            {/* Comparison table */}
            {showComparison && (
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Plan Comparison
                    </h3>

                    {/* TODO: Implement detailed comparison table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="p-6 bg-gray-50">
                            <p className="text-gray-600 text-center">
                                Detailed feature comparison coming soon...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Secure payment info */}
            <div className="mt-8 text-center text-sm text-gray-600">
                <p>
                    🔒 Payments are securely processed by Razorpay. Your data is
                    safe.
                </p>
            </div>
        </div>
    );
}
