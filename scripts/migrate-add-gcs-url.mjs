#!/usr/bin/env node

/**
 * Migration script to add gcs_url column to resumes table
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

async function runMigration() {
    console.log('🔄 Running migration: Add gcs_url to resumes table');
    console.log('================================================\n');

    try {
        const sql = neon(DATABASE_URL);

        console.log('Checking if gcs_url column exists...');
        
        // Check if column exists
        const checkResult = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'resumes' 
            AND column_name = 'gcs_url'
        `;

        if (checkResult.length > 0) {
            console.log('\n✓ gcs_url column already exists in resumes table');
            process.exit(0);
        }

        console.log('Adding gcs_url column to resumes table...');
        
        // Add the column
        await sql`ALTER TABLE resumes ADD COLUMN gcs_url TEXT`;

        console.log('\n✅ Migration completed successfully!');
        console.log('   Column gcs_url has been added to resumes table');
        
        // Verify the column was added
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'resumes' 
            AND column_name = 'gcs_url'
        `;

        if (result.length > 0) {
            console.log('\n✓ Verified: gcs_url column exists');
            console.log(`  Type: ${result[0].data_type}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
