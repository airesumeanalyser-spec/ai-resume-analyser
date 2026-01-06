/**
 * Plans Route
 * 
 * Dedicated page for displaying all pricing plans with:
 * - Plan cards with features
 * - Plan comparison table
 * - Free trial status
 * - FAQ section
 * - Call-to-action buttons
 * 
 * Route: /plans
 * 
 * Features:
 * - Client-side user data fetching
 * - Free trial calculation
 * - Current plan detection
 * - Payment integration
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import PlansPage from '~/components/PlansPage';
import { PlanType } from '~/lib/razorpay';

/**
 * PlansRoute Component
 */
export default function PlansRoute() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<{
        currentPlan?: PlanType;
        freeTrialDaysRemaining: number;
        freeTrialTotalDays: number;
        userInfo?: {
            name?: string;
            email?: string;
            phone?: string;
        };
    }>({
        freeTrialDaysRemaining: 14,
        freeTrialTotalDays: 14,
    });

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/auth?action=status', {
                    credentials: 'include',
                });

                if (!response.ok) {
                    return;
                }

                const user = await response.json();

                // Calculate free trial days remaining
                let freeTrialDaysRemaining = 14;
                const freeTrialTotalDays = 14;

                if (user.trial_started_at) {
                    const trialStartDate = new Date(user.trial_started_at);
                    const today = new Date();
                    const trialEndDate = new Date(
                        trialStartDate.getTime() + freeTrialTotalDays * 24 * 60 * 60 * 1000
                    );

                    freeTrialDaysRemaining = Math.max(
                        0,
                        Math.ceil(
                            (trialEndDate.getTime() - today.getTime()) /
                                (1000 * 60 * 60 * 24)
                        )
                    );
                }

                setUserData({
                    currentPlan: user.plan_type,
                    freeTrialDaysRemaining,
                    freeTrialTotalDays,
                    userInfo: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                    },
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleSelectPlan = (plan: PlanType) => {
        // Log plan selection for analytics
        console.log('Plan selected:', plan);
    };

    const handlePaymentSuccess = async (plan: PlanType) => {
        setIsLoading(true);
        try {
            // Update user's plan in the database
            const response = await fetch('/api/auth/upgrade-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    planType: plan,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (response.ok) {
                // Show success message and redirect
                console.log('Payment successful, plan upgraded to:', plan);
                
                // Redirect to home or dashboard
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                console.error('Failed to update plan');
                alert('Payment was successful, but there was an issue updating your plan. Please contact support.');
            }
        } catch (error) {
            console.error('Error processing payment success:', error);
            alert('Payment was successful, but there was an issue updating your plan. Please contact support.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <PlansPage
                currentPlan={userData.currentPlan}
                freeTrialDaysRemaining={userData.freeTrialDaysRemaining}
                freeTrialTotalDays={userData.freeTrialTotalDays}
                userInfo={userData.userInfo}
                onSelectPlan={handleSelectPlan}
                onPaymentSuccess={handlePaymentSuccess}
            />

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-900 font-semibold">
                            Updating your plan...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Error boundary for this route
 */
export function ErrorBoundary() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Oops! Something went wrong
                </h1>
                <p className="text-gray-600 mb-8">
                    We encountered an error loading the plans page. Please try again later.
                </p>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Go Back Home
                </a>
            </div>
        </div>
    );
}
