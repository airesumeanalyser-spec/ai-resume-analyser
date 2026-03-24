import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    getGoogleUserInfo,
    createUserSession,
    setSessionCookie,
    verifyStateToken,
} from '../../app/lib/auth';

/**
 * OAuth callback handler
 * Handles the redirect from Google OAuth with authorization code
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
        const forwardedHost = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim();
        const host = forwardedHost || req.headers.host;
        const protocol = forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
        const requestBaseUrl = host
            ? `${protocol}://${host}`
            : process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : process.env.BASE_URL || 'http://localhost:5173';

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
        const googleUser = await getGoogleUserInfo(code, requestBaseUrl);

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
