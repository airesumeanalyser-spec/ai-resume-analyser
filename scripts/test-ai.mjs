#!/usr/bin/env node

/**
 * Test script for Vertex AI integration
 * 
 * Run with: npm run test:ai
 */

import 'dotenv/config';
import { isAIAvailable, generateContent, chat } from '../app/lib/ai.ts';

console.log('🧪 Testing Vertex AI Integration...\n');

async function testAIAvailability() {
    console.log('1️⃣ Testing AI Availability...');
    const available = isAIAvailable();
    
    if (available) {
        console.log('✅ Vertex AI is available and configured\n');
        return true;
    } else {
        console.log('❌ Vertex AI is NOT available');
        console.log('Check these environment variables:');
        console.log('  - GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID ? '✓' : '✗');
        console.log('  - VERTEX_AI_LOCATION:', process.env.VERTEX_AI_LOCATION ? '✓' : '✗');
        console.log('  - VERTEX_AI_MODEL:', process.env.VERTEX_AI_MODEL ? '✓' : '✗');
        console.log('  - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✓' : '✗');
        console.log();
        return false;
    }
}

async function testSimpleGeneration() {
    console.log('2️⃣ Testing Simple Content Generation...');
    
    try {
        const response = await generateContent(
            'Write a one-sentence professional summary for a software engineer with 5 years of experience.',
            { temperature: 0.7, maxTokens: 100 }
        );
        
        console.log('✅ Generated content successfully:');
        console.log(`   "${response.trim()}"\n`);
        return true;
    } catch (error) {
        console.log('❌ Failed to generate content');
        console.error('   Error:', error.message);
        console.log();
        return false;
    }
}

async function testChatConversation() {
    console.log('3️⃣ Testing Chat Conversation...');
    
    try {
        const response = await chat([
            { role: 'user', content: 'What makes a good resume?' }
        ]);
        
        console.log('✅ Chat response received successfully');
        console.log('   Message length:', response.message.content.length, 'characters');
        console.log('   First 100 chars:', response.message.content.substring(0, 100) + '...\n');
        return true;
    } catch (error) {
        console.log('❌ Failed chat conversation');
        console.error('   Error:', error.message);
        console.log();
        return false;
    }
}

async function testResumeAnalysis() {
    console.log('4️⃣ Testing Resume Analysis...');
    
    const sampleResume = `
John Doe
Software Engineer
Email: john@example.com | Phone: (555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 5 years of full-stack development expertise.

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020-Present
- Led development of microservices architecture
- Improved system performance by 40%

Software Developer | StartUp Inc | 2018-2020
- Built responsive web applications
- Collaborated with cross-functional teams

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2018

SKILLS
Python, JavaScript, React, Node.js, AWS, Docker
`;
    
    try {
        const { analyzeResume } = await import('../app/lib/ai.ts');
        const analysis = await analyzeResume(sampleResume);
        
        console.log('✅ Resume analysis completed successfully');
        console.log('   ATS Score:', analysis.ats_score);
        console.log('   Overall Score:', analysis.overall_score);
        console.log('   Strengths:', analysis.strengths?.length || 0);
        console.log('   Weaknesses:', analysis.weaknesses?.length || 0);
        console.log('   Improvements:', analysis.improvements?.length || 0);
        console.log('   Keywords found:', analysis.keywords?.present?.length || 0);
        console.log();
        return true;
    } catch (error) {
        console.log('❌ Failed resume analysis');
        console.error('   Error:', error.message);
        console.log();
        return false;
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('Starting Vertex AI Integration Tests');
    console.log('='.repeat(60));
    console.log();

    const results = {
        availability: await testAIAvailability(),
        generation: false,
        chat: false,
        analysis: false,
    };

    if (!results.availability) {
        console.log('⚠️  Skipping remaining tests (AI not available)\n');
        console.log('='.repeat(60));
        console.log('Test Summary: 0/4 tests passed');
        console.log('='.repeat(60));
        process.exit(1);
    }

    results.generation = await testSimpleGeneration();
    results.chat = await testChatConversation();
    results.analysis = await testResumeAnalysis();

    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log('AI Availability:', results.availability ? '✅ PASS' : '❌ FAIL');
    console.log('Content Generation:', results.generation ? '✅ PASS' : '❌ FAIL');
    console.log('Chat Conversation:', results.chat ? '✅ PASS' : '❌ FAIL');
    console.log('Resume Analysis:', results.analysis ? '✅ PASS' : '❌ FAIL');
    console.log('='.repeat(60));

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    console.log(`\n${passed}/${total} tests passed\n`);

    if (passed === total) {
        console.log('🎉 All tests passed! Vertex AI is fully configured.\n');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please check your configuration.\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch((error) => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
