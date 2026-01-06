/**
 * Razorpay Payment Utilities
 * 
 * This module contains utility functions and constants for handling Razorpay
 * payments on the frontend. It provides helper methods for:
 * - Loading the Razorpay SDK script
 * - Creating payment orders
 * - Handling payment callbacks
 * - Managing payment states
 * 
 * TODO: Update RAZORPAY_KEY_ID once credentials are available from Razorpay Dashboard
 */

/**
 * Razorpay Key ID
 * Get this from: Razorpay Dashboard > Account Settings > API Keys
 * TODO: Replace with actual key when available
 */
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RZP_KEY_ID || '';

/**
 * Razorpay API base URL
 */
export const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

/**
 * Razorpay SDK script URL
 */
export const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Payment status enum
 */
export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

/**
 * Payment plan types
 * TODO: Configure based on your pricing strategy
 */
export enum PlanType {
    BASIC = 'basic',
    PREMIUM = 'premium',
    ENTERPRISE = 'enterprise',
}

/**
 * Pricing configuration
 * All amounts are in paise (1 rupee = 100 paise)
 * Monthly billing plans with comprehensive features
 */
export const PRICING = {
    [PlanType.BASIC]: {
        amount: 29900, // ₹299/month
        currency: 'INR',
        description: 'Basic Resume Analysis',
        displayName: 'Starter',
        billingPeriod: 'month',
        features: [
            'Up to 5 Resume Uploads',
            'ATS Score Analysis',
            'Basic AI Feedback',
            'Keyword Suggestions',
            'Resume Templates',
            'Email Support',
        ],
        limitations: [
            'Limited to 5 resumes/month',
            'Standard support (24-48 hours)',
            'Basic analytics only',
        ],
    },
    [PlanType.PREMIUM]: {
        amount: 79900, // ₹799/month
        currency: 'INR',
        description: 'Premium Resume Analysis',
        displayName: 'Professional',
        billingPeriod: 'month',
        features: [
            'Unlimited Resume Uploads',
            'Advanced ATS Score',
            'Detailed AI Feedback',
            'Keyword Optimization',
            'Resume Building Tools',
            'Priority Email Support',
            'Cover Letter Analysis',
            'Interview Preparation Tips',
            'Resume History & Versions',
            'Batch Resume Analysis',
        ],
        limitations: [
            'Priority support (4-12 hours)',
            'Standard analytics',
        ],
    },
    [PlanType.ENTERPRISE]: {
        amount: 299900, // ₹2,999/month
        currency: 'INR',
        description: 'Enterprise Resume Analysis',
        displayName: 'Enterprise',
        billingPeriod: 'month',
        features: [
            'Unlimited Everything',
            'Advanced AI Analysis',
            'Custom Feedback',
            'Advanced Keyword Optimization',
            'Premium Templates',
            '24/7 Priority Support',
            'Cover Letter & Portfolio Analysis',
            'Full Interview Prep Suite',
            'Advanced Analytics Dashboard',
            'Batch & Bulk Processing',
            'API Access',
            'Custom Integrations',
            'Dedicated Account Manager',
            'Advanced Security Features',
        ],
        limitations: [],
    },
};

/**
 * Type definition for payment metadata
 */
export interface PaymentMetadata {
    plan: PlanType;
    user_id?: string;
    email?: string;
    phone?: string;
    custom_notes?: Record<string, string>;
}

/**
 * Type definition for payment order response
 */
export interface PaymentOrder {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    receipt: string;
    created_at: number;
}

/**
 * Type definition for payment response from Razorpay
 */
export interface PaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Type definition for Razorpay checkout options
 */
export interface RazorpayCheckoutOptions {
    key: string;
    order_id: string;
    name: string;
    description: string;
    image?: string;
    amount: number;
    currency: string;
    email?: string;
    contact?: string;
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    handler: (response: PaymentResponse) => void;
    modal?: {
        ondismiss?: () => void;
    };
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
}

/**
 * Loads the Razorpay SDK script dynamically
 * 
 * This function should be called once when the payment component mounts.
 * It adds the Razorpay checkout script to the page.
 * 
 * @returns Promise that resolves when script is loaded
 * 
 * TODO: Test script loading once Razorpay account is configured
 */
export function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if ((window as any).Razorpay) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;

        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            reject(new Error('Failed to load Razorpay script'));
        };

        document.body.appendChild(script);
    });
}

/**
 * Creates a payment order via your backend
 * 
 * This calls your backend endpoint which communicates with Razorpay
 * to create an order. The order is required before initiating payment.
 * 
 * @param planType - The plan to create order for
 * @param metadata - Additional metadata for the order
 * @returns Promise with order details
 * 
 * TODO: Ensure backend endpoint is running when testing
 */
export async function createPaymentOrder(
    planType: PlanType,
    metadata?: Partial<PaymentMetadata>
): Promise<PaymentOrder> {
    const pricing = PRICING[planType];

    try {
        const response = await fetch('/api/payments?action=create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: pricing.amount,
                currency: pricing.currency,
                description: pricing.description,
                notes: {
                    plan: planType,
                    ...metadata?.custom_notes,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create order');
        }

        const data = await response.json();
        return data.order;
    } catch (error) {
        console.error('Error creating payment order:', error);
        throw error;
    }
}

/**
 * Verifies a payment with the backend
 * 
 * After Razorpay completes the payment, this function sends the payment
 * details to your backend for verification. The backend validates the
 * signature to ensure the payment is authentic.
 * 
 * @param paymentResponse - Response from Razorpay checkout
 * @returns Promise with verification result
 * 
 * TODO: Backend verification implementation
 */
export async function verifyPayment(
    paymentResponse: PaymentResponse
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch('/api/payments?action=verify-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentResponse),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Payment verification failed');
        }

        const data = await response.json();
        return {
            success: data.success,
            message: data.message,
        };
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
}

/**
 * Initiates Razorpay payment checkout
 * 
 * This is the main function to initiate a payment. It:
 * 1. Creates an order via backend
 * 2. Opens Razorpay checkout modal
 * 3. Handles payment callback
 * 4. Verifies payment on backend
 * 
 * @param planType - The plan to purchase
 * @param options - Additional checkout options (email, phone, etc.)
 * @returns Promise that resolves when payment is complete
 * 
 * TODO: Test full flow with Razorpay credentials
 */
export async function initiatePayment(
    planType: PlanType,
    options?: {
        name?: string;
        email?: string;
        phone?: string;
        onSuccess?: (response: PaymentResponse) => void;
        onError?: (error: Error) => void;
    }
): Promise<void> {
    try {
        // Validate Razorpay key is configured
        if (!RAZORPAY_KEY_ID) {
            throw new Error(
                'Razorpay not configured. Please contact support.'
            );
        }

        // Load Razorpay script if not already loaded
        await loadRazorpayScript();

        // Create payment order
        const order = await createPaymentOrder(planType, {
            email: options?.email,
            phone: options?.phone,
        });

        const pricing = PRICING[planType];

        // Check if we're in test mode (order ID contains 'test')
        const isTestMode = order.id.includes('test');

        if (isTestMode) {
            // In test mode, simulate payment without opening Razorpay
            console.log('TEST MODE: Simulating payment...');
            
            // Simulate user completing payment
            const mockPaymentResponse: PaymentResponse = {
                razorpay_payment_id: `pay_test_${Date.now()}`,
                razorpay_order_id: order.id,
                razorpay_signature: `sig_test_${Date.now()}`,
            };

            try {
                // Verify the simulated payment
                const verification = await verifyPayment(mockPaymentResponse);

                if (verification.success) {
                    console.log('TEST MODE: Payment simulation successful');
                    options?.onSuccess?.(mockPaymentResponse);
                } else {
                    throw new Error(verification.message);
                }
            } catch (error) {
                console.error('TEST MODE: Payment simulation failed:', error);
                options?.onError?.(error as Error);
            }
            return;
        }

        // Prepare checkout options for real Razorpay
        const checkoutOptions: RazorpayCheckoutOptions = {
            key: RAZORPAY_KEY_ID,
            order_id: order.id,
            name: 'AI Resume Analyzer',
            description: pricing.description,
            amount: pricing.amount,
            currency: pricing.currency,
            email: options?.email,
            contact: options?.phone,
            prefill: {
                name: options?.name,
                email: options?.email,
                contact: options?.phone,
            },
            theme: {
                color: '#4F46E5', // Indigo color matching the app theme
            },
            handler: async (response: PaymentResponse) => {
                try {
                    // Verify payment on backend
                    const verification = await verifyPayment(response);

                    if (verification.success) {
                        console.log('Payment successful:', response.razorpay_payment_id);
                        options?.onSuccess?.(response);
                    } else {
                        throw new Error(verification.message);
                    }
                } catch (error) {
                    console.error('Payment verification failed:', error);
                    options?.onError?.(error as Error);
                }
            },
            modal: {
                ondismiss: () => {
                    console.log('Payment modal dismissed');
                    options?.onError?.(new Error('Payment cancelled by user'));
                },
            },
        };

        // Open Razorpay checkout
        const razorpayCheckout = new (window as any).Razorpay(checkoutOptions);
        razorpayCheckout.open();

    } catch (error) {
        console.error('Error initiating payment:', error);
        throw error;
    }
}

/**
 * Formats amount from paise to rupees for display
 * 
 * @param amountInPaise - Amount in paise
 * @returns Formatted string like "₹299.00"
 */
export function formatAmount(amountInPaise: number): string {
    const amountInRupees = amountInPaise / 100;
    return `₹${amountInRupees.toFixed(2)}`;
}

/**
 * Gets plan details by type
 * 
 * @param planType - The plan type
 * @returns Plan details with pricing and features
 */
export function getPlanDetails(planType: PlanType) {
    return {
        ...PRICING[planType],
        type: planType,
        formattedAmount: formatAmount(PRICING[planType].amount),
    };
}
