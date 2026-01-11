import { neon, neonConfig } from '@neondatabase/serverless';

// Disable connection cache to avoid stale prepared statements
neonConfig.fetchConnectionCache = false;

// Get database connection string from environment
const DATABASE_URL = process.env.DATABASE_URL;

// Create SQL query function - fresh connection each time
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null as any;

// Ensure database is configured before operations
function ensureDatabase() {
    if (!DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set. Please configure it in your Vercel environment variables.');
    }
}

/**
 * Database helper functions
 */

// User operations
export async function createUser(uuid: string, username: string, email?: string) {
    ensureDatabase();
    // Use a simpler INSERT that doesn't require trial columns
    // The database defaults will handle trial_uses and max_trial_uses
    const result = await sql`
        INSERT INTO users (uuid, name, email)
        VALUES (${uuid}, ${username}, ${email || null})
        ON CONFLICT (uuid) DO UPDATE
        SET name = ${username}, email = ${email || null}, updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `;
    return result[0];
}

export async function getUserByUuid(uuid: string) {
    const result = await sql`
        SELECT * FROM users WHERE uuid = ${uuid} LIMIT 1
    `;
    return result[0] || null;
}

export async function getUserById(id: string) {
    const result = await sql`
        SELECT * FROM users WHERE id = ${id} LIMIT 1
    `;
    return result[0] || null;
}

// Trial tracking operations
export async function getTrialUsage(userId: string): Promise<{ used: number; remaining: number; max: number }> {
    try {
        // Use a fresh connection to avoid stale prepared statements
        const freshSql = neon(DATABASE_URL!);
        const result = await freshSql`
            SELECT id, trial_uses, max_trial_uses FROM users WHERE id = ${userId} LIMIT 1
        `;
        const row = result[0];
        if (!row) {
            return { used: 0, remaining: 3, max: 3 };
        }
        const used = parseInt(row.trial_uses) || 0;
        const max = parseInt(row.max_trial_uses) || 3;
        return { used, remaining: Math.max(0, max - used), max };
    } catch (error) {
        // If columns don't exist yet, return defaults
        console.warn('Trial usage check failed, using defaults:', error);
        return { used: 0, remaining: 3, max: 3 };
    }
}

export async function incrementTrialUsage(userId: string): Promise<{ success: boolean; used: number; remaining: number; max: number }> {
    try {
        // Use a fresh connection to avoid stale prepared statements
        const freshSql = neon(DATABASE_URL!);
        
        // Get current values
        const current = await freshSql`SELECT id, trial_uses, max_trial_uses FROM users WHERE id = ${userId} LIMIT 1`;
        if (!current[0]) {
            return { success: false, used: 0, remaining: 0, max: 3 };
        }
        
        const currentTrialUses = parseInt(current[0].trial_uses) || 0;
        const newTrialUses = currentTrialUses + 1;
        const max = parseInt(current[0].max_trial_uses) || 3;
        
        // Update trial_uses with fresh connection
        await freshSql`UPDATE users SET trial_uses = ${newTrialUses}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}`;
        
        return { success: true, used: newTrialUses, remaining: Math.max(0, max - newTrialUses), max };
    } catch (error) {
        console.error('Failed to increment trial usage:', error);
        return { success: false, used: 0, remaining: 0, max: 3 };
    }
}

export async function canUseFreeTrial(userId: string): Promise<boolean> {
    const { remaining } = await getTrialUsage(userId);
    return remaining > 0;
}

// Session operations
export async function createSession(userId: string, sessionToken: string, expiresAt: Date) {
    const result = await sql`
        INSERT INTO sessions (user_id, session_token, expires_at)
        VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()})
        RETURNING *
    `;
    return result[0];
}

export async function getSessionByToken(sessionToken: string) {
    const result = await sql`
        SELECT s.*, u.uuid, u.name as username, u.email
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken}
        AND s.expires_at > CURRENT_TIMESTAMP
        LIMIT 1
    `;
    return result[0] || null;
}

export async function deleteSession(sessionToken: string) {
    await sql`
        DELETE FROM sessions WHERE session_token = ${sessionToken}
    `;
}

export async function cleanupExpiredSessions() {
    await sql`
        DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP
    `;
}

// Resume operations
export async function createResume(data: {
    userId: string;
    fileName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    gcsUrl?: string;
}) {
    const result = await sql`
        INSERT INTO resumes (user_id, file_name, file_path, file_size, mime_type, gcs_url)
        VALUES (
            ${data.userId},
            ${data.fileName},
            ${data.filePath},
            ${data.fileSize || null},
            ${data.mimeType || null},
            ${data.gcsUrl || null}
        )
        RETURNING *
    `;
    return result[0];
}

export async function getResumeById(id: string) {
    const result = await sql`
        SELECT * FROM resumes WHERE id = ${id} LIMIT 1
    `;
    return result[0] || null;
}

export async function getResumesByUserId(userId: string, limit = 50) {
    const result = await sql`
        SELECT * FROM resumes
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
    `;
    return result;
}

export async function updateResumeAnalysis(id: string, analysisData: any, atsScore?: number) {
    const result = await sql`
        UPDATE resumes
        SET analysis_data = ${JSON.stringify(analysisData)},
            ats_score = ${atsScore || null}
        WHERE id = ${id}
        RETURNING *
    `;
    return result[0];
}

export async function deleteResume(id: string) {
    await sql`
        DELETE FROM resumes WHERE id = ${id}
    `;
}

// Key-Value store operations (backward compatible with Puter KV)
export async function kvGet(key: string, userId?: string) {
    const result = userId
        ? await sql`SELECT value FROM kv_store WHERE key = ${key} AND user_id = ${userId} LIMIT 1`
        : await sql`SELECT value FROM kv_store WHERE key = ${key} AND user_id IS NULL LIMIT 1`;
    return result[0]?.value || null;
}

export async function kvSet(key: string, value: string, userId?: string) {
    await sql`
        INSERT INTO kv_store (key, value, user_id)
        VALUES (${key}, ${value}, ${userId || null})
        ON CONFLICT (key) DO UPDATE
        SET value = ${value}, updated_at = CURRENT_TIMESTAMP
    `;
    return true;
}

export async function kvDelete(key: string, userId?: string) {
    const result = userId
        ? await sql`DELETE FROM kv_store WHERE key = ${key} AND user_id = ${userId}`
        : await sql`DELETE FROM kv_store WHERE key = ${key} AND user_id IS NULL`;
    return true;
}

export async function kvList(pattern: string, returnValues = false, userId?: string) {
    // Convert simple wildcard pattern to SQL LIKE pattern
    const sqlPattern = pattern.replace(/\*/g, '%');
    
    const result = userId
        ? await sql`
            SELECT key, value FROM kv_store
            WHERE key LIKE ${sqlPattern}
            AND user_id = ${userId}
            ORDER BY key
        `
        : await sql`
            SELECT key, value FROM kv_store
            WHERE key LIKE ${sqlPattern}
            AND user_id IS NULL
            ORDER BY key
        `;

    if (returnValues) {
        return result.map((row: any) => ({ key: row.key, value: row.value }));
    }
    return result.map((row: any) => row.key);
}

export async function kvFlush(userId?: string) {
    if (userId) {
        await sql`DELETE FROM kv_store WHERE user_id = ${userId}`;
    } else {
        await sql`DELETE FROM kv_store WHERE user_id IS NULL`;
    }
    return true;
}

// Database initialization
export async function initializeDatabase() {
    try {
        // Test connection
        await sql`SELECT 1`;
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}
