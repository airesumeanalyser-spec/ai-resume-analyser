import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getGoogleAuthUrl,
    generateStateToken,
    getSessionToken,
    destroySession,
    clearSessionCookie,
    getAuthenticatedUser,
    getGoogleUserInfo,
    createUserSession,
    setSessionCookie,
    verifyStateToken,
} from '../app/lib/auth';
// TRIAL/PAYMENT DISABLED
// import { getTrialUsage } from '../app/lib/db';

/**
 * Unified Auth endpoint handling all authentication operations
 * 
 * Supported actions:
 * - GET /api/auth?action=signin&next=<path> - Initiate Google OAuth sign-in
 * - POST /api/auth?action=signout - Sign out and destroy session
 * - GET /api/auth?action=status - Check authentication status
 * - GET /api/auth?action=callback&code=<code>&state=<state> - OAuth callback
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const action = (req.query.action as string) || 'status';

        // Route to appropriate handler based on action
        switch (action) {
            case 'signin':
                if (req.method !== 'GET') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleSignIn(req, res);

            case 'signout':
                if (req.method !== 'POST') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleSignOut(req, res);

            case 'status':
                if (req.method !== 'GET') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleStatus(req, res);

            case 'callback':
                if (req.method !== 'GET') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleCallback(req, res);

            default:
                return res.status(400).json({
                    error: `Unknown action: ${action}`,
                });
        }
    } catch (error) {
        console.error('Auth endpoint error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleSignIn(req: VercelRequest, res: VercelResponse) {
    try {
        const next = (req.query.next as string) || '/';
        const state = generateStateToken(next);
        const authUrl = getGoogleAuthUrl(state);

        return res.redirect(302, authUrl);
    } catch (error) {
        console.error('Sign-in error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleSignOut(req: VercelRequest, res: VercelResponse) {
    try {
        const sessionToken = getSessionToken(req);

        if (sessionToken) {
            await destroySession(sessionToken);
        }

        clearSessionCookie(res);

        return res.status(200).json({
            success: true,
            message: 'Signed out successfully',
        });
    } catch (error) {
        console.error('Sign-out error:', error);
        clearSessionCookie(res);

        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleStatus(req: VercelRequest, res: VercelResponse) {
    try {
        // Check if database is configured
        if (!process.env.DATABASE_URL) {
            console.error('DATABASE_URL is not configured');
            return res.status(200).json({
                isAuthenticated: false,
                user: null,
                error: 'Database not configured',
            });
        }

        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(200).json({
                isAuthenticated: false,
                user: null,
            });
        }

        // TRIAL/PAYMENT DISABLED - No longer fetching trial usage
        // let trialUsage = { used: 0, remaining: 3, max: 3 };
        // try {
        //     trialUsage = await getTrialUsage(user.id);
        // } catch (trialError) {
        //     console.warn('Failed to get trial usage, using defaults:', trialError);
        // }

        return res.status(200).json({
            isAuthenticated: true,
            user: {
                uuid: user.uuid,
                username: user.username,
                email: user.email,
            },
            // TRIAL/PAYMENT DISABLED - Always show unlimited access
            // trial: {
            //     used: trialUsage.used,
            //     remaining: trialUsage.remaining,
            //     max: trialUsage.max,
            // },
            // plan_type: trialUsage.remaining > 0 ? 'free_trial' : 'free_expired',
            trial: {
                used: 0,
                remaining: 999,
                max: 999,
            },
            plan_type: 'unlimited',
        });
    } catch (error) {
        console.error('Status check error:', error);
        // Return unauthenticated state instead of 500 error for better UX
        return res.status(200).json({
            isAuthenticated: false,
            user: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleCallback(req: VercelRequest, res: VercelResponse) {
    try {
        const { code, state, error: oauthError } = req.query;

        // Handle OAuth errors
        if (oauthError) {
            console.error('OAuth error:', oauthError);
            return res.redirect(302, `/?error=${encodeURIComponent(String(oauthError))}`);
        }

        if (!code || typeof code !== 'string') {
            return res.redirect(302, '/?error=missing_code');
        }

        // Get user info from Google
        const googleUser = await getGoogleUserInfo(code);

        if (!googleUser.email) {
            return res.redirect(302, '/?error=no_email');
        }

        // Create session
        const { sessionToken } = await createUserSession(
            googleUser.id,
            googleUser.name,
            googleUser.email
        );

        // Set session cookie
        setSessionCookie(res, sessionToken);

        // Parse state to get redirect URL
        const stateData = verifyStateToken(state as string);
        const redirectTo = stateData?.redirectTo || '/upload';

        // Redirect to the original page or default
        return res.redirect(302, redirectTo);
    } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.redirect(302, `/?error=${encodeURIComponent(errorMessage)}`);
    }
}
