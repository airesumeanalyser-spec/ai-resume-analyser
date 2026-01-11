import type { VercelRequest, VercelResponse } from '@vercel/node';
// TRIAL/PAYMENT DISABLED - This entire endpoint is disabled
// import Razorpay from 'razorpay';
// import crypto from 'crypto';

/**
 * DISABLED: Unified Payments endpoint handling all payment operations
 * Payments have been disabled - all users have unlimited access
 */

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

    // TRIAL/PAYMENT DISABLED - Return disabled message
    return res.status(200).json({
        success: true,
        message: 'Payments are disabled. All users have unlimited access.',
        disabled: true,
    });
}

/*
// ORIGINAL PAYMENT CODE - COMMENTED OUT

import Razorpay from 'razorpay';
import crypto from 'crypto';

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

// ... rest of the payment handlers
*/
