#!/usr/bin/env node
/**
 * OAuth Configuration Test
 * Verifies that your OAuth setup is correct
 */

import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

console.log('🔍 Checking OAuth Configuration...\n');

let hasErrors = false;

// Check Client ID
if (!GOOGLE_CLIENT_ID) {
    console.log('❌ GOOGLE_CLIENT_ID is not set in .env');
    hasErrors = true;
} else {
    console.log('✅ GOOGLE_CLIENT_ID is set');
    console.log(`   Value: ${GOOGLE_CLIENT_ID}`);
    
    if (!GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
        console.log('⚠️  Warning: Client ID format looks incorrect');
        hasErrors = true;
    }
}

// Check Client Secret
if (!GOOGLE_CLIENT_SECRET) {
    console.log('\n❌ GOOGLE_CLIENT_SECRET is not set in .env');
    hasErrors = true;
} else {
    console.log('\n✅ GOOGLE_CLIENT_SECRET is set');
    console.log(`   Value: ${GOOGLE_CLIENT_SECRET.substring(0, 10)}...`);
}

// Check BASE_URL
console.log(`\n✅ BASE_URL: ${BASE_URL}`);

// Show required redirect URI
const redirectUri = `${BASE_URL}/api/auth/callback`;
console.log(`\n📍 Your OAuth redirect URI is:\n   ${redirectUri}`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Google Cloud Console Configuration Required:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n1️⃣  Authorized JavaScript origins:');
console.log(`   ${BASE_URL}`);

console.log('\n2️⃣  Authorized redirect URIs:');
console.log(`   ${redirectUri}`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (hasErrors) {
    console.log('\n⚠️  Please fix the errors above before testing OAuth');
    process.exit(1);
} else {
    console.log('\n✅ Configuration looks good!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add the URIs above to Google Cloud Console');
    console.log('   2. Wait 2-5 minutes for changes to propagate');
    console.log('   3. Clear your browser cache/cookies');
    console.log('   4. Try signing in at: http://localhost:5173');
}

console.log('\n🔗 Google Cloud Console:');
console.log('   https://console.cloud.google.com/apis/credentials\n');
