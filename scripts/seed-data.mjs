#!/usr/bin/env node
/**
 * Seed database with test data for development
 * Usage: node scripts/seed-data.mjs
 */

import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function seedData() {
    console.log('🌱 Seeding database with test data...\n');

    try {
        // Create test users
        const testUsers = [
            {
                uuid: randomUUID(),
                name: 'John Developer',
                email: 'john@example.com',
                subscription_tier: 'free',
                trial_uses: 1,
                max_trial_uses: 3,
            },
            {
                uuid: randomUUID(),
                name: 'Jane Engineer',
                email: 'jane@example.com',
                subscription_tier: 'pro',
                trial_uses: 3,
                max_trial_uses: 3,
            },
            {
                uuid: randomUUID(),
                name: 'Test User',
                email: 'test@example.com',
                subscription_tier: 'free',
                trial_uses: 0,
                max_trial_uses: 3,
            },
        ];

        console.log('👤 Creating test users...');
        const createdUsers = [];
        
        for (const user of testUsers) {
            const result = await sql`
                INSERT INTO users (uuid, name, email, subscription_tier, trial_uses, max_trial_uses)
                VALUES (${user.uuid}, ${user.name}, ${user.email}, ${user.subscription_tier}, ${user.trial_uses}, ${user.max_trial_uses})
                ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                RETURNING id, name, email
            `;
            createdUsers.push(result[0]);
            console.log(`   ✅ Created user: ${result[0].name} (${result[0].email})`);
        }

        // Create sample resumes
        console.log('\n📄 Creating sample resumes...');
        
        const sampleResumes = [
            {
                user_id: createdUsers[0].id,
                file_name: 'john_developer_resume.pdf',
                file_path: '/uploads/john_developer_resume.pdf',
                file_size: 125000,
                mime_type: 'application/pdf',
                ats_score: 78,
                analysis_data: JSON.stringify({
                    score: 78,
                    summary: 'Strong technical resume with good experience in web development.',
                    strengths: ['Clear formatting', 'Relevant skills listed', 'Quantified achievements'],
                    improvements: ['Add more keywords', 'Include soft skills', 'Expand project descriptions'],
                    keywords: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
                    experience_years: 5,
                }),
            },
            {
                user_id: createdUsers[0].id,
                file_name: 'john_backend_resume.pdf',
                file_path: '/uploads/john_backend_resume.pdf',
                file_size: 98000,
                mime_type: 'application/pdf',
                ats_score: 65,
                analysis_data: JSON.stringify({
                    score: 65,
                    summary: 'Backend-focused resume, needs more detail on projects.',
                    strengths: ['Good technical depth', 'Clear experience timeline'],
                    improvements: ['Missing action verbs', 'Add metrics', 'Better summary section'],
                    keywords: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes'],
                    experience_years: 3,
                }),
            },
            {
                user_id: createdUsers[1].id,
                file_name: 'jane_engineer_resume.pdf',
                file_path: '/uploads/jane_engineer_resume.pdf',
                file_size: 156000,
                mime_type: 'application/pdf',
                ats_score: 92,
                analysis_data: JSON.stringify({
                    score: 92,
                    summary: 'Excellent resume with strong ATS optimization.',
                    strengths: ['Highly optimized for ATS', 'Strong action verbs', 'Quantified results', 'Relevant keywords'],
                    improvements: ['Consider adding certifications section'],
                    keywords: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science', 'AWS', 'SQL'],
                    experience_years: 7,
                }),
            },
        ];

        for (const resume of sampleResumes) {
            await sql`
                INSERT INTO resumes (user_id, file_name, file_path, file_size, mime_type, ats_score, analysis_data)
                VALUES (${resume.user_id}, ${resume.file_name}, ${resume.file_path}, ${resume.file_size}, ${resume.mime_type}, ${resume.ats_score}, ${resume.analysis_data}::jsonb)
            `;
            console.log(`   ✅ Created resume: ${resume.file_name} (ATS Score: ${resume.ats_score})`);
        }

        // Create sample sessions
        console.log('\n🔐 Creating sample sessions...');
        
        for (const user of createdUsers) {
            const sessionToken = `test_session_${randomUUID()}`;
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            
            await sql`
                INSERT INTO sessions (user_id, session_token, expires_at)
                VALUES (${user.id}, ${sessionToken}, ${expiresAt})
            `;
            console.log(`   ✅ Created session for: ${user.name}`);
        }

        // Create sample KV entries
        console.log('\n🗄️  Creating sample KV entries...');
        
        await sql`
            INSERT INTO kv_store (key, value, user_id)
            VALUES ('last_analysis_date', ${new Date().toISOString()}, ${createdUsers[0].id})
            ON CONFLICT (key, user_id) DO UPDATE SET value = EXCLUDED.value
        `;
        console.log('   ✅ Created KV entry: last_analysis_date');

        await sql`
            INSERT INTO kv_store (key, value, user_id)
            VALUES ('preferences', ${'{"theme":"dark","notifications":true}'}, ${createdUsers[0].id})
            ON CONFLICT (key, user_id) DO UPDATE SET value = EXCLUDED.value
        `;
        console.log('   ✅ Created KV entry: preferences');

        // Summary
        console.log('\n📊 Seed data summary:');
        
        const userCount = await sql`SELECT COUNT(*) as count FROM users`;
        const resumeCount = await sql`SELECT COUNT(*) as count FROM resumes`;
        const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions`;
        const kvCount = await sql`SELECT COUNT(*) as count FROM kv_store`;
        
        console.log(`   Users: ${userCount[0].count}`);
        console.log(`   Resumes: ${resumeCount[0].count}`);
        console.log(`   Sessions: ${sessionCount[0].count}`);
        console.log(`   KV Entries: ${kvCount[0].count}`);
        
        console.log('\n🎉 Database seeded successfully!');

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
}

seedData();
