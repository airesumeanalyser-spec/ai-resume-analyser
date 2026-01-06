/**
 * Razorpay Payment React Hooks
 * 
 * Custom hooks for managing payment state and operations in React components.
 * These hooks abstract the payment logic and make it easy to use payments
 * in any component.
 * 
 * TODO: Integrate with your state management (Zustand/Redux) if needed
 */

import { useState, useCallback, useEffect } from 'react';
import {
    PaymentStatus,
    type PaymentResponse,
    PlanType,
    initiatePayment,
    loadRazorpayScript,
    RAZORPAY_KEY_ID,
} from './razorpay';

/**
 * State for a payment transaction
 */
export interface PaymentState {
    status: PaymentStatus;
    error: Error | null;
    loading: boolean;
    paymentResponse: PaymentResponse | null;
}

/**
 * Initial payment state
 */
const initialPaymentState: PaymentState = {
    status: PaymentStatus.PENDING,
    error: null,
    loading: false,
    paymentResponse: null,
};

/**
 * Hook: usePayment
 * 
 * Manages the complete payment flow for a single transaction.
 * 
 * Usage:
 * ```tsx
 * const { status, error, processPayment, isLoading } = usePayment();
 * 
 * const handlePayment = async () => {
 *     await processPayment(PlanType.PREMIUM, {
 *         email: 'user@example.com',
 *         phone: '+919999999999',
 *     });
 * };
 * ```
 * 
 * TODO: Add payment retry logic
 * TODO: Add payment history tracking
 */
export function usePayment() {
    const [state, setState] = useState<PaymentState>(initialPaymentState);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load Razorpay script on component mount
    useEffect(() => {
        const loadScript = async () => {
            try {
                // Warn if Razorpay key is not configured
                if (!RAZORPAY_KEY_ID) {
                    console.warn(
                        'Razorpay key ID not configured. ' +
                        'Please set VITE_RAZORPAY_KEY_ID environment variable.'
                    );
                    return;
                }

                // Load Razorpay script
                await loadRazorpayScript();
                setScriptLoaded(true);
            } catch (error) {
                console.error('Failed to load Razorpay script:', error);
                setState(prev => ({
                    ...prev,
                    error: error as Error,
                }));
            }
        };

        loadScript();
    }, []);

    /**
     * Process a payment for a specific plan
     * 
     * @param planType - The plan to purchase
     * @param userDetails - User's email and phone for prefilling checkout
     */
    const processPayment = useCallback(
        async (
            planType: PlanType,
            userDetails?: {
                name?: string;
                email?: string;
                phone?: string;
            }
        ) => {
            try {
                // Set loading state
                setState(prev => ({
                    ...prev,
                    status: PaymentStatus.PROCESSING,
                    loading: true,
                    error: null,
                }));

                // Initiate payment
                await initiatePayment(planType, {
                    ...userDetails,
                    onSuccess: (response) => {
                        setState(prev => ({
                            ...prev,
                            status: PaymentStatus.COMPLETED,
                            loading: false,
                            paymentResponse: response,
                        }));
                    },
                    onError: (error) => {
                        setState(prev => ({
                            ...prev,
                            status: PaymentStatus.FAILED,
                            loading: false,
                            error,
                        }));
                    },
                });
            } catch (error) {
                setState(prev => ({
                    ...prev,
                    status: PaymentStatus.FAILED,
                    loading: false,
                    error: error as Error,
                }));
            }
        },
        []
    );

    /**
     * Cancel the current payment and reset state
     */
    const cancelPayment = useCallback(() => {
        setState(prev => ({
            ...prev,
            status: PaymentStatus.CANCELLED,
            loading: false,
        }));
    }, []);

    /**
     * Reset payment state
     */
    const resetPayment = useCallback(() => {
        setState(initialPaymentState);
    }, []);

    return {
        // State
        status: state.status,
        error: state.error,
        isLoading: state.loading,
        paymentResponse: state.paymentResponse,
        scriptLoaded,

        // Actions
        processPayment,
        cancelPayment,
        resetPayment,

        // Helper getters
        isPaymentSuccess: state.status === PaymentStatus.COMPLETED,
        isPaymentFailed: state.status === PaymentStatus.FAILED,
        isPaymentPending: state.status === PaymentStatus.PENDING,
        isPaymentProcessing: state.status === PaymentStatus.PROCESSING,
    };
}

/**
 * Hook: usePaymentPlans
 * 
 * Hook for managing multiple plan payments (like subscription switching).
 * 
 * Usage:
 * ```tsx
 * const { currentPlan, switchPlan, isLoading } = usePaymentPlans(PlanType.BASIC);
 * 
 * const handleUpgrade = async () => {
 *     await switchPlan(PlanType.PREMIUM, { email: 'user@example.com' });
 * };
 * ```
 * 
 * TODO: Implement plan switching/downgrading logic
 * TODO: Add proration calculation for plan changes
 */
export function usePaymentPlans(initialPlan?: PlanType) {
    const [currentPlan, setCurrentPlan] = useState<PlanType | null>(
        initialPlan || null
    );
    const { processPayment, ...paymentState } = usePayment();

    /**
     * Switch to a different plan
     * 
     * @param newPlan - The new plan to switch to
     * @param userDetails - User details for payment
     */
    const switchPlan = useCallback(
        async (
            newPlan: PlanType,
            userDetails?: {
                name?: string;
                email?: string;
                phone?: string;
            }
        ) => {
            try {
                await processPayment(newPlan, userDetails);
                setCurrentPlan(newPlan);
            } catch (error) {
                console.error('Failed to switch plan:', error);
                throw error;
            }
        },
        [processPayment]
    );

    /**
     * Upgrade to a higher tier plan
     */
    const upgradePlan = useCallback(
        async (
            newPlan: PlanType,
            userDetails?: {
                name?: string;
                email?: string;
                phone?: string;
            }
        ) => {
            // TODO: Calculate proration for upgrade
            await switchPlan(newPlan, userDetails);
        },
        [switchPlan]
    );

    /**
     * Downgrade to a lower tier plan
     */
    const downgradePlan = useCallback(
        async (
            newPlan: PlanType,
            userDetails?: {
                name?: string;
                email?: string;
                phone?: string;
            }
        ) => {
            // TODO: Calculate proration for downgrade
            // TODO: Handle refunds if applicable
            await switchPlan(newPlan, userDetails);
        },
        [switchPlan]
    );

    return {
        currentPlan,
        switchPlan,
        upgradePlan,
        downgradePlan,
        ...paymentState,
    };
}

/**
 * Hook: usePaymentHistory
 * 
 * Hook for tracking and displaying payment history.
 * 
 * Usage:
 * ```tsx
 * const { history, loadHistory, isLoading } = usePaymentHistory();
 * 
 * useEffect(() => {
 *     loadHistory();
 * }, []);
 * ```
 * 
 * TODO: Implement backend endpoint for payment history
 * TODO: Add filtering and pagination
 */
export interface PaymentHistoryItem {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    plan: PlanType;
    created_at: string;
}

export function usePaymentHistory() {
    const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Load payment history from backend
     * 
     * TODO: Implement this endpoint in your backend
     */
    const loadHistory = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Implement backend endpoint
            // const response = await fetch('/api/payments/history');
            // const data = await response.json();
            // setHistory(data.payments);

            console.log('Payment history would be loaded from backend');
        } catch (err) {
            setError(err as Error);
            console.error('Failed to load payment history:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get payment by ID
     */
    const getPaymentById = useCallback(
        (id: string) => {
            return history.find(p => p.id === id);
        },
        [history]
    );

    /**
     * Get payments by status
     */
    const getPaymentsByStatus = useCallback(
        (status: PaymentStatus) => {
            return history.filter(p => p.status === status);
        },
        [history]
    );

    return {
        history,
        loading,
        error,
        loadHistory,
        getPaymentById,
        getPaymentsByStatus,
    };
}
