#!/usr/bin/env node
/**
 * Database Migration Script
 * Adds the uuid column to the users table if it doesn't exist
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('Please create a .env file with your Neon database URL');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
    console.log('🔄 Starting database migration...\n');

    try {
        // Check if uuid column exists
        console.log('1. Checking if uuid column exists...');
        const checkResult = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'uuid'
        `;

        if (checkResult.length > 0) {
            console.log('✅ uuid column already exists in users table');
            console.log('   No migration needed!');
            return;
        }

        console.log('⚠️  uuid column not found, adding it now...\n');

        // Add uuid column
        console.log('2. Adding uuid column...');
        await sql`ALTER TABLE users ADD COLUMN uuid VARCHAR(255)`;
        console.log('   ✅ Column added');

        // Populate existing rows
        console.log('3. Populating existing rows with uuid values...');
        const updateResult = await sql`UPDATE users SET uuid = id::text WHERE uuid IS NULL`;
        console.log(`   ✅ Updated ${updateResult.length} rows`);

        // Make it NOT NULL
        console.log('4. Setting NOT NULL constraint...');
        await sql`ALTER TABLE users ALTER COLUMN uuid SET NOT NULL`;
        console.log('   ✅ NOT NULL constraint added');

        // Add unique constraint
        console.log('5. Adding UNIQUE constraint...');
        await sql`ALTER TABLE users ADD CONSTRAINT users_uuid_unique UNIQUE (uuid)`;
        console.log('   ✅ UNIQUE constraint added');

        console.log('\n🎉 Migration completed successfully!');
        
        // Verify the changes
        console.log('\n6. Verifying table structure...');
        const columns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `;
        
        console.log('\nUsers table columns:');
        console.table(columns);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('\n✅ All done! You can now restart your dev server and try signing in.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
