import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Unified Payments endpoint handling all payment operations
 * 
 * Supported actions:
 * - POST /api/payments?action=create-order - Create a Razorpay order
 * - POST /api/payments?action=verify-payment - Verify a payment
 */

const RAZORPAY_KEY_ID = process.env.RZP_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RZP_KEY_SECRET || '';

// Enable test mode only if credentials are not set or are clearly test credentials
const IS_TEST_MODE = !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || 
                     RAZORPAY_KEY_ID.startsWith('rzp_test_') ||
                     RAZORPAY_KEY_SECRET.startsWith('test_');

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.warn(
        'Razorpay credentials not configured. Running in TEST MODE. ' +
        'Please set RZP_KEY_ID and RZP_KEY_SECRET environment variables for production.'
    );
} else if (IS_TEST_MODE) {
    console.log('Running in Razorpay TEST MODE');
} else {
    console.log('Running in Razorpay LIVE MODE');
}

// Initialize Razorpay only if we have valid credentials
let razorpay: any = null;
if (!IS_TEST_MODE) {
    razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
    });
}

interface CreateOrderRequest {
    amount: number;
    currency?: string;
    description?: string;
    notes?: Record<string, string>;
    customer_notify?: number;
}

interface VerifyPaymentRequest {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

function validateAmount(amount: number): boolean {
    const MIN_AMOUNT = 100;
    const MAX_AMOUNT = 5000000;
    return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
}

function verifySignature(
    order_id: string,
    payment_id: string,
    signature: string,
    secret: string
): boolean {
    const data = `${order_id}|${payment_id}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');

    return expectedSignature === signature;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const action = (req.query.action as string) || 'create-order';

        switch (action) {
            case 'create-order':
                return handleCreateOrder(req, res);

            case 'verify-payment':
                return handleVerifyPayment(req, res);

            default:
                return res.status(400).json({
                    error: `Unknown action: ${action}`,
                });
        }
    } catch (error) {
        console.error('Payments endpoint error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleCreateOrder(req: VercelRequest, res: VercelResponse) {
    try {
        const { amount, currency = 'INR', description, notes, customer_notify } =
            req.body as CreateOrderRequest;

        // Validate amount
        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Amount is required and must be a number',
            });
        }

        if (!validateAmount(amount)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Amount must be between ₹1 and ₹50,000',
            });
        }

        // Validate currency
        if (!['INR', 'USD', 'EUR'].includes(currency)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Currency must be INR, USD, or EUR',
            });
        }

        // In TEST MODE, return a mock order
        if (IS_TEST_MODE) {
            console.log('TEST MODE: Creating mock payment order');
            const mockOrderId = `order_test_${Date.now()}`;
            return res.status(200).json({
                success: true,
                order: {
                    id: mockOrderId,
                    entity: 'order',
                    amount: amount,
                    amount_paid: 0,
                    amount_due: amount,
                    currency: currency,
                    receipt: `rcpt_${Date.now()}`,
                    offer_id: null,
                    status: 'created',
                    attempts: 0,
                    notes: notes || {},
                    created_at: Math.floor(Date.now() / 1000),
                },
            });
        }

        // Create order with Razorpay (production)
        const orderData = {
            amount,
            currency,
            ...(description && { description }),
            ...(notes && { notes }),
            ...(customer_notify !== undefined && { customer_notify }),
        };

        console.log('Creating Razorpay order with:', { amount, currency, description });
        const order = await razorpay.orders.create(orderData);
        console.log('Razorpay order created:', order.id);

        return res.status(200).json({
            success: true,
            order: {
                id: order.id,
                entity: order.entity,
                amount: order.amount,
                amount_paid: order.amount_paid,
                amount_due: order.amount_due,
                currency: order.currency,
                receipt: order.receipt,
                offer_id: order.offer_id,
                status: order.status,
                attempts: order.attempts,
                notes: order.notes,
                created_at: order.created_at,
            },
        });
    } catch (error) {
        console.error('Create order error:', error);

        if (error instanceof Error) {
            if (error.message.includes('invalid_key') || error.message.includes('Authentication failed')) {
                return res.status(503).json({
                    success: false,
                    error: 'Payment service unavailable',
                    message: 'Razorpay credentials are invalid. Running in test mode - use test credentials to proceed.',
                });
            }
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to create payment order',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleVerifyPayment(req: VercelRequest, res: VercelResponse) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            req.body as VerifyPaymentRequest;

        // Validate input
        if (!razorpay_order_id || typeof razorpay_order_id !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Order ID is required',
            });
        }

        if (!razorpay_payment_id || typeof razorpay_payment_id !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Payment ID is required',
            });
        }

        if (!razorpay_signature || typeof razorpay_signature !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Signature is required',
            });
        }

        // In TEST MODE, accept any signature (for development/testing)
        if (IS_TEST_MODE) {
            console.log('TEST MODE: Accepting payment verification');
            return res.status(200).json({
                success: true,
                message: 'Payment verified successfully (TEST MODE)',
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
            });
        }

        // Verify signature (production mode)
        const isSignatureValid = verifySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            RAZORPAY_KEY_SECRET
        );

        if (!isSignatureValid) {
            return res.status(400).json({
                success: false,
                error: 'Payment verification failed',
                message: 'Invalid signature - payment may have been tampered with',
            });
        }

        // Signature is valid - payment is authenticated
        // In a production app, you would also verify with Razorpay API and update your database here

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({
            success: false,
            error: 'Payment verification failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
