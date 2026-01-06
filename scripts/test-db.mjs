#!/usr/bin/env node

/**
 * Test script to verify Neon database connection and setup
 * Run with: node --loader tsx scripts/test-db.mjs
 * Or add to package.json scripts and run: npm run test:db
 */

import { initializeDatabase, kvSet, kvGet, kvList, kvDelete } from '../app/lib/db.js';

async function testDatabase() {
    console.log('🧪 Testing Neon Database Connection...\n');

    try {
        // Test 1: Initialize and test connection
        console.log('1️⃣ Testing database connection...');
        await initializeDatabase();
        console.log('   ✅ Database connection successful\n');

        // Test 2: Set a key-value pair
        console.log('2️⃣ Testing KV Set...');
        const testKey = 'test:connection';
        const testValue = JSON.stringify({ 
            timestamp: new Date().toISOString(),
            test: 'success' 
        });
        await kvSet(testKey, testValue);
        console.log(`   ✅ Set key: ${testKey}\n`);

        // Test 3: Get the value back
        console.log('3️⃣ Testing KV Get...');
        const retrievedValue = await kvGet(testKey);
        if (retrievedValue === testValue) {
            console.log(`   ✅ Retrieved value matches: ${retrievedValue}\n`);
        } else {
            throw new Error('Retrieved value does not match!');
        }

        // Test 4: List keys with pattern
        console.log('4️⃣ Testing KV List...');
        const keys = await kvList('test:*', false);
        console.log(`   ✅ Found ${keys.length} keys matching pattern "test:*"`);
        console.log(`   Keys: ${keys.join(', ')}\n`);

        // Test 5: Delete the test key
        console.log('5️⃣ Testing KV Delete...');
        await kvDelete(testKey);
        const deletedValue = await kvGet(testKey);
        if (deletedValue === null) {
            console.log('   ✅ Key successfully deleted\n');
        } else {
            throw new Error('Key was not deleted!');
        }

        console.log('🎉 All tests passed! Your Neon database is ready to use.\n');
        console.log('📝 Next steps:');
        console.log('   1. Set up Google Cloud Storage for file uploads');
        console.log('   2. Configure Vertex AI for resume analysis');
        console.log('   3. Implement authentication endpoints');
        
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Database test failed:');
        console.error(error);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check that DATABASE_URL is set in your .env file');
        console.error('   2. Verify the connection string is correct');
        console.error('   3. Ensure the schema has been applied to your database');
        console.error('   4. Run: psql "$DATABASE_URL" -f schema.sql\n');
        
        process.exit(1);
    }
}

// Run the test
testDatabase();
