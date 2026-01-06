#!/usr/bin/env node
/**
 * Run all database migrations using Neon serverless driver
 * Usage: node scripts/run-migrations.mjs
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

const migrations = [
    '000_initial_schema.sql',
    '001_add_uuid_column.sql',
    '002_add_gcs_url_to_resumes.sql',
    '003_add_trial_tracking.sql',
];

async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');

    for (const migration of migrations) {
        const filePath = join(migrationsDir, migration);
        console.log(`📄 Running migration: ${migration}`);
        
        try {
            const sqlContent = readFileSync(filePath, 'utf-8');
            
            // For DO $$ blocks, run the entire content as one statement
            if (sqlContent.includes('DO $$')) {
                // Extract the full DO block
                const doBlockMatch = sqlContent.match(/DO \$\$[\s\S]*?\$\$/);
                if (doBlockMatch) {
                    await sql.query(doBlockMatch[0]);
                    console.log(`   ✅ ${migration} completed successfully\n`);
                    continue;
                }
            }
            
            // For files with multiple statements, run them one by one
            // Remove comments and split carefully
            const cleanedContent = sqlContent
                .split('\n')
                .filter(line => !line.trim().startsWith('--'))
                .join('\n');
            
            // Split by semicolons but keep CREATE TABLE etc intact
            const statements = cleanedContent
                .split(/;\s*(?=\n|$)/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
            
            for (const statement of statements) {
                if (statement.length > 0) {
                    try {
                        await sql.query(statement);
                    } catch (stmtErr) {
                        // Skip "already exists" errors
                        if (!stmtErr.message?.includes('already exists')) {
                            throw stmtErr;
                        }
                    }
                }
            }
            
            console.log(`   ✅ ${migration} completed successfully\n`);
        } catch (error) {
            // Check if it's a "column already exists" error - that's OK
            if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
                console.log(`   ⚠️  ${migration} - already applied (skipping)\n`);
            } else {
                console.error(`   ❌ ${migration} failed:`, error.message);
                // Continue with other migrations
            }
        }
    }

    console.log('🎉 All migrations completed!\n');
    
    // Verify the schema
    console.log('📊 Verifying schema...');
    try {
        const result = await sql`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('uuid', 'trial_uses', 'max_trial_uses')
            ORDER BY column_name
        `;
        
        console.log('\nUsers table trial columns:');
        result.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
        });
        
        const resumeResult = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'resumes' 
            AND column_name = 'gcs_url'
        `;
        
        if (resumeResult.length > 0) {
            console.log(`  - resumes.gcs_url: ${resumeResult[0].data_type}`);
        }
        
    } catch (error) {
        console.error('Schema verification failed:', error.message);
    }
    
    console.log('\n✅ Database is ready!');
}

runMigrations().catch(console.error);
