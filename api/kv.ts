import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kvGet, kvSet, kvDelete, kvList, kvFlush } from '../app/lib/db';
import { getAuthenticatedUser } from '../app/lib/auth';

/**
 * Unified Key-Value Store endpoint handling all KV operations
 * 
 * Supported actions:
 * - GET /api/kv?action=get&key=<key> - Get a value
 * - POST /api/kv?action=set - Set a key-value pair
 * - POST /api/kv?action=delete - Delete a key
 * - GET /api/kv?action=list&pattern=<pattern>&values=<boolean> - List keys
 * - POST /api/kv?action=flush - Delete all keys
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
        const action = (req.query.action as string) || 'get';

        // Route to appropriate handler based on action
        switch (action) {
            case 'get':
                if (req.method !== 'GET') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleGet(req, res);

            case 'set':
                if (req.method !== 'POST') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleSet(req, res);

            case 'delete':
                if (req.method !== 'POST') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleDelete(req, res);

            case 'list':
                if (req.method !== 'GET') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleList(req, res);

            case 'flush':
                if (req.method !== 'POST') {
                    return res.status(405).json({ error: 'Method not allowed' });
                }
                return handleFlush(req, res);

            default:
                return res.status(400).json({
                    error: `Unknown action: ${action}`,
                });
        }
    } catch (error) {
        console.error('KV endpoint error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
    try {
        const { key } = req.query;

        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'Key is required' });
        }

        const user = await getAuthenticatedUser(req);
        const userId = user?.id;

        const value = await kvGet(key, userId);

        if (value === null) {
            return res.status(404).json({ error: 'Key not found', value: null });
        }

        return res.status(200).json({ key, value });
    } catch (error) {
        console.error('KV get error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleSet(req: VercelRequest, res: VercelResponse) {
    try {
        const { key, value } = req.body;

        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'Key is required' });
        }

        if (value === undefined || value === null) {
            return res.status(400).json({ error: 'Value is required' });
        }

        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        const user = await getAuthenticatedUser(req);
        const userId = user?.id;

        await kvSet(key, stringValue, userId);

        return res.status(200).json({ success: true, key });
    } catch (error) {
        console.error('KV set error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
    try {
        const { key } = req.body;

        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'Key is required' });
        }

        const user = await getAuthenticatedUser(req);
        const userId = user?.id;

        await kvDelete(key, userId);

        return res.status(200).json({ success: true, key });
    } catch (error) {
        console.error('KV delete error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
    try {
        const { pattern, values } = req.query;

        if (!pattern || typeof pattern !== 'string') {
            return res.status(400).json({ error: 'Pattern is required' });
        }

        const returnValues = values === 'true' || values === '1';

        const user = await getAuthenticatedUser(req);
        const userId = user?.id;

        const result = await kvList(pattern, returnValues, userId);

        return res.status(200).json({
            pattern,
            count: result.length,
            items: result,
        });
    } catch (error) {
        console.error('KV list error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}

async function handleFlush(req: VercelRequest, res: VercelResponse) {
    try {
        const user = await getAuthenticatedUser(req);
        const userId = user?.id;

        await kvFlush(userId);

        return res.status(200).json({ success: true, message: 'All keys flushed' });
    } catch (error) {
        console.error('KV flush error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
