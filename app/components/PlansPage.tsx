/**
 * Plans Page Component
 * 
 * Comprehensive plans page showing all available subscription plans with:
 * - Detailed features and benefits
 * - Free trial information
 * - Plan comparison table
 * - Pricing details
 * - Call-to-action buttons
 * 
 * Features:
 * - Responsive grid layout
 * - Featured plan highlighting
 * - Plan comparison table
 * - Trial status display
 * - Easy navigation to payment
 * 
 * TODO: Customize features based on your offering
 */

import { useState } from 'react';
import { PlanType, getPlanDetails } from '~/lib/razorpay';
import { Check, X, Zap, Shield, Headphones } from 'lucide-react';
import PlanCard from './PlanCard';
import PlansComparisonTable from './PlansComparisonTable';
import TrialStatusBadge from './TrialStatusBadge';
import PaymentGateway from './PaymentGateway';

/**
 * Props for PlansPage
 */
interface PlansPageProps {
    /**
     * User's current plan (if any)
     */
    currentPlan?: PlanType;

    /**
     * Days of free trial remaining
     */
    freeTrialDaysRemaining?: number;

    /**
     * Total free trial days allowed
     */
    freeTrialTotalDays?: number;

    /**
     * User information for checkout
     */
    userInfo?: {
        name?: string;
        email?: string;
        phone?: string;
    };

    /**
     * Callback when plan is selected for purchase
     */
    onSelectPlan?: (plan: PlanType) => void;

    /**
     * Callback on successful payment
     */
    onPaymentSuccess?: (plan: PlanType) => void;
}

/**
 * FAQ Item Component
 */
function FAQItem({
    question,
    answer,
}: {
    question: string;
    answer: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 pb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left hover:opacity-75 transition-opacity"
            >
                <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
                <span className="text-indigo-600 text-xl">
                    {isOpen ? '−' : '+'}
                </span>
            </button>
            {isOpen && (
                <p className="mt-4 text-gray-600 leading-relaxed">{answer}</p>
            )}
        </div>
    );
}

/**
 * Feature Card Component
 */
function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Zap;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white rounded-lg p-8 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                <Icon className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

/**
 * Main PlansPage Component
 */
function PlansPage({
    currentPlan,
    freeTrialDaysRemaining = 14,
    freeTrialTotalDays = 14,
    userInfo,
    onSelectPlan,
    onPaymentSuccess,
}: PlansPageProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards');

    const handleSelectPlan = (plan: PlanType) => {
        setSelectedPlan(plan);
        onSelectPlan?.(plan);
        setShowPayment(true);
    };

    const handlePaymentSuccess = () => {
        if (selectedPlan) {
            onPaymentSuccess?.(selectedPlan);
        }
        setShowPayment(false);
        setSelectedPlan(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                    Choose Your Plan
                </h1>
                <p className="text-xl text-gray-600">
                    Powerful resume analysis tools for every career stage
                </p>

                {/* Free Trial Badge */}
                {freeTrialDaysRemaining > 0 && (
                    <div className="mt-6">
                        <TrialStatusBadge
                            daysRemaining={freeTrialDaysRemaining}
                            totalDays={freeTrialTotalDays}
                        />
                    </div>
                )}
            </div>

            {/* View Mode Toggle */}
            <div className="max-w-7xl mx-auto mb-8 flex justify-center gap-4">
                <button
                    onClick={() => setViewMode('cards')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                        viewMode === 'cards'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-600'
                    }`}
                >
                    View Plans
                </button>
                <button
                    onClick={() => setViewMode('comparison')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                        viewMode === 'comparison'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-600'
                    }`}
                >
                    Compare Plans
                </button>
            </div>

            {/* Plans Grid or Comparison */}
            <div className="max-w-7xl mx-auto">
                {viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {Object.values(PlanType).map((planType) => (
                            <PlanCard
                                key={planType}
                                planType={planType}
                                isCurrentPlan={currentPlan === planType}
                                isFeatured={planType === PlanType.PREMIUM}
                                onSelectPlan={handleSelectPlan}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mb-12">
                        <PlansComparisonTable
                            currentPlan={currentPlan}
                            onSelectPlan={handleSelectPlan}
                        />
                    </div>
                )}
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mt-16 bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    Frequently Asked Questions
                </h2>

                <div className="space-y-6">
                    <FAQItem
                        question="Can I change my plan later?"
                        answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll pro-rate any charges or credits."
                    />
                    <FAQItem
                        question="What's included in the free trial?"
                        answer="The free trial gives you access to all Basic plan features for 14 days. No credit card required to start."
                    />
                    <FAQItem
                        question="Is there a money-back guarantee?"
                        answer="Yes! If you're not satisfied within 7 days of purchase, we'll refund your money, no questions asked."
                    />
                    <FAQItem
                        question="Can I cancel anytime?"
                        answer="Absolutely. You can cancel your subscription at any time through your account settings. Your access continues until the end of your billing period."
                    />
                    <FAQItem
                        question="Do you offer annual plans?"
                        answer="Yes! Annual plans are available at a 20% discount compared to monthly billing. Contact our sales team for details."
                    />
                </div>
            </div>

            {/* Features Overview */}
            <div className="max-w-7xl mx-auto mt-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Why Choose AI Resume Analyzer?
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={Zap}
                        title="Instant Analysis"
                        description="Get your ATS score and detailed feedback in seconds, not hours."
                    />
                    <FeatureCard
                        icon={Shield}
                        title="100% Secure"
                        description="Your resume data is encrypted and never shared with third parties."
                    />
                    <FeatureCard
                        icon={Headphones}
                        title="Expert Support"
                        description="Get help from our career experts whenever you need it."
                    />
                </div>
            </div>

            {/* Payment Gateway Modal */}
            {showPayment && selectedPlan && (
                <PaymentGateway
                    visiblePlans={[selectedPlan]}
                    onPaymentSuccess={handlePaymentSuccess}
                    userInfo={userInfo}
                />
            )}
        </div>
    );
}

export default PlansPage;
