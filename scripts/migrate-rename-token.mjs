#!/usr/bin/env node
/**
 * Migration: Rename token to session_token in sessions table
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
    console.log('🔄 Starting database migration: rename token to session_token...\n');

    try {
        // Check if session_token column exists
        console.log('1. Checking current columns...');
        const checkResult = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'sessions'
        `;
        
        const columnNames = checkResult.map(r => r.column_name);
        console.log('   Current columns:', columnNames.join(', '));

        if (columnNames.includes('session_token')) {
            console.log('\n✅ session_token column already exists');
            console.log('   No migration needed!');
            return;
        }

        if (!columnNames.includes('token')) {
            console.log('\n⚠️  Warning: Neither token nor session_token column exists!');
            console.log('   You may need to run the full schema.sql');
            return;
        }

        console.log('\n2. Renaming token to session_token...');
        await sql`ALTER TABLE sessions RENAME COLUMN token TO session_token`;
        console.log('   ✅ Column renamed');

        console.log('\n🎉 Migration completed successfully!');
        
        // Verify the changes
        console.log('\n3. Verifying table structure...');
        const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'sessions'
            ORDER BY ordinal_position
        `;
        
        console.log('\nSessions table columns:');
        console.table(columns);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

runMigration()
    .then(() => {
        console.log('\n✅ Migration complete! Try signing in again.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
