import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import {
    createUser,
    createSession,
    getSessionByToken,
    deleteSession,
    cleanupExpiredSessions,
} from './db';

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-min-32-chars';
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '86400000'); // 24 hours default
const BASE_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.BASE_URL || 'http://localhost:5173';

// Cookie configuration
const COOKIE_NAME = 'session_token';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE / 1000, // Convert to seconds
};

/**
 * Initialize Google OAuth2 client
 */
export function getOAuth2Client() {
    const redirectUri = `${BASE_URL}/api/auth/callback`;
    
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        redirectUri
    );
}

/**
 * Generate OAuth URL for Google sign-in
 */
export function getGoogleAuthUrl(state?: string) {
    const oauth2Client = getOAuth2Client();
    
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: state || '/',
        prompt: 'select_account',
    });
}

/**
 * Exchange authorization code for tokens and get user info
 */
export async function getGoogleUserInfo(code: string) {
    const oauth2Client = getOAuth2Client();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
        id: data.id || '',
        email: data.email || '',
        name: data.name || data.email || 'User',
        picture: data.picture,
    };
}

/**
 * Create and store a new session
 */
export async function createUserSession(userUuid: string, username: string, email?: string) {
    // Create or update user in database
    const user = await createUser(userUuid, username, email);
    
    // Generate session token
    const sessionToken = jwt.sign(
        { userId: user.id, uuid: userUuid },
        SESSION_SECRET,
        { expiresIn: SESSION_MAX_AGE / 1000 }
    );

    // Store session in database
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);
    await createSession(user.id, sessionToken, expiresAt);

    return { sessionToken, user };
}

/**
 * Verify and get session from token
 */
export async function verifySession(sessionToken: string) {
    try {
        // Verify JWT
        jwt.verify(sessionToken, SESSION_SECRET);
        
        // Check database
        const session = await getSessionByToken(sessionToken);
        
        if (!session) {
            return null;
        }

        return {
            user: {
                id: session.user_id,
                uuid: session.uuid,
                username: session.username,
                email: session.email,
            },
            session: {
                id: session.id,
                expiresAt: session.expires_at,
            },
        };
    } catch (error) {
        return null;
    }
}

/**
 * Destroy a session
 */
export async function destroySession(sessionToken: string) {
    await deleteSession(sessionToken);
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(res: VercelResponse, sessionToken: string) {
    const cookie = serialize(COOKIE_NAME, sessionToken, COOKIE_OPTIONS);
    res.setHeader('Set-Cookie', cookie);
}

/**
 * Clear session cookie in response
 */
export function clearSessionCookie(res: VercelResponse) {
    const cookie = serialize(COOKIE_NAME, '', {
        ...COOKIE_OPTIONS,
        maxAge: 0,
    });
    res.setHeader('Set-Cookie', cookie);
}

/**
 * Get session token from request cookies
 */
export function getSessionToken(req: VercelRequest): string | null {
    const cookies = parse(req.headers.cookie || '');
    return cookies[COOKIE_NAME] || null;
}

/**
 * Middleware: Get authenticated user from request
 */
export async function getAuthenticatedUser(req: VercelRequest) {
    const sessionToken = getSessionToken(req);
    
    if (!sessionToken) {
        return null;
    }

    const sessionData = await verifySession(sessionToken);
    return sessionData?.user || null;
}

/**
 * Middleware: Require authentication (throws if not authenticated)
 */
export async function requireAuth(req: VercelRequest, res: VercelResponse) {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
        res.status(401).json({ error: 'Unauthorized', message: 'Please sign in' });
        return null;
    }

    return user;
}

/**
 * Background task: Clean up expired sessions
 */
export async function cleanupSessions() {
    try {
        await cleanupExpiredSessions();
    } catch (error) {
        console.error('Failed to cleanup expired sessions:', error);
    }
}

/**
 * Generate a unique state token for OAuth
 */
export function generateStateToken(redirectTo?: string): string {
    const state = {
        nonce: uuidv4(),
        redirectTo: redirectTo || '/',
        timestamp: Date.now(),
    };
    
    return jwt.sign(state, SESSION_SECRET, { expiresIn: '10m' });
}

/**
 * Verify and decode state token
 */
export function verifyStateToken(token: string): { redirectTo: string } | null {
    try {
        const decoded = jwt.verify(token, SESSION_SECRET) as any;
        return { redirectTo: decoded.redirectTo || '/' };
    } catch (error) {
        return null;
    }
}
