"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbService_1 = require("../services/dbService");
const recommendationEngine_1 = require("../recommendation/recommendationEngine");
const eligibilityEngine_1 = require("../recommendation/eligibilityEngine");
const TEST_CASES = [
    // Test case 1: Ram, farmer from Bihar (expects agricultural/central/Bihar farmer support)
    {
        profile: {
            name: 'Ram',
            age: 52,
            gender: 'Male',
            state: 'Bihar',
            income: 90000,
            occupation: 'Farmer',
            maritalStatus: 'Married',
            category: 'OBC',
            disabilityStatus: false
        },
        query: 'I am Ram, a farmer from Bihar. I am married and earn around 90,000 per year.',
        expectedSchemeId: 'akckvy' // Bihar potato farming area expansion scheme
    },
    // Test case 2: Brahmin applicant from Andhra Pradesh for funeral expenses
    {
        profile: {
            name: 'Brahmin Relative',
            age: 40,
            gender: 'Male',
            state: 'Andhra Pradesh',
            income: 60000,
            occupation: 'Other',
            maritalStatus: 'Married',
            category: 'Brahmin',
            disabilityStatus: false
        },
        query: 'Need funeral assistance for a deceased relative who was a Brahmin in Andhra Pradesh. Family income is 60,000.',
        expectedSchemeId: 'gsfe' // Garuda Scheme for Funeral Expense
    },
    // Test case 3: Unregistered laborer in Madhya Pradesh
    {
        profile: {
            name: 'MP Laborer Nominee',
            age: 35,
            gender: 'Male',
            state: 'Madhya Pradesh',
            income: 80000,
            occupation: 'Construction Worker',
            maritalStatus: 'Married',
            category: 'OBC',
            disabilityStatus: false
        },
        query: 'I am applying for death benefits of an unregistered construction worker who died on site in MP. I am the nominee.',
        expectedSchemeId: 'baepsicodouldwact' // Burial and Ex-gratia MP
    }
];
async function runEvaluation() {
    console.log('--- Starting Sahayak AI Automated Evaluation ---');
    // 1. Initialize DB and BM25 index
    const ingestLimit = process.env.INGEST_LIMIT ? parseInt(process.env.INGEST_LIMIT, 10) : 150;
    await (0, dbService_1.initializeDbService)(ingestLimit);
    let successfulRetrievalsAt5 = 0;
    let successfulRetrievalsAt10 = 0;
    let totalReciprocalRank = 0;
    let totalE2ELatency = 0;
    let eligibilityViolationsCount = 0;
    console.log(`\nEvaluating ${TEST_CASES.length} standard casework scenarios...`);
    for (let i = 0; i < TEST_CASES.length; i++) {
        const tc = TEST_CASES[i];
        console.log(`\n[Test Case ${i + 1}] Query: "${tc.query}"`);
        console.log(`Expected Scheme: "${tc.expectedSchemeId}"`);
        const start = Date.now();
        // Run recommendation engine
        const { recommendations } = await (0, recommendationEngine_1.getRecommendations)(tc.profile, tc.query, 10);
        const latency = Date.now() - start;
        totalE2ELatency += latency;
        // Find expected scheme rank
        const foundIndex = recommendations.findIndex(r => r.schemeId === tc.expectedSchemeId);
        const rank = foundIndex !== -1 ? foundIndex + 1 : -1;
        if (rank !== -1 && rank <= 5) {
            successfulRetrievalsAt5++;
        }
        if (rank !== -1 && rank <= 10) {
            successfulRetrievalsAt10++;
        }
        if (rank !== -1) {
            totalReciprocalRank += 1 / rank;
            console.log(`🟢 Expected scheme found at Rank: ${rank} (Latency: ${latency}ms)`);
        }
        else {
            console.log(`🔴 Expected scheme NOT found in top 10 (Latency: ${latency}ms)`);
            console.log(`   Top matched schemes returned: [${recommendations.map(r => r.schemeId).join(', ')}]`);
            // Print eligibility debug info for expected scheme
            const schemes = (0, dbService_1.getAllSchemes)();
            const expectedScheme = schemes.find(s => s.schemeId === tc.expectedSchemeId);
            if (expectedScheme) {
                const eligibility = (0, eligibilityEngine_1.evaluateEligibility)(tc.profile, expectedScheme);
                console.log(`   Expected Scheme Eligibility Status: isEligible=${eligibility.isEligible}, score=${eligibility.score}`);
                console.log(`   Reasons:`, eligibility.reasons);
            }
            else {
                console.log(`   Expected Scheme "${tc.expectedSchemeId}" not found in memory DB!`);
            }
        }
        // Verify eligibility engine constraints (make sure no recommended scheme violates profile filters)
        recommendations.forEach(rec => {
            // Check state mismatch
            if (rec.level.toLowerCase() === 'state' && tc.profile.state) {
                // Since we split by commas in vectorRetriever, check if matches
                const matchesState = rec.reasons.some(r => r.toLowerCase().includes(tc.profile.state.toLowerCase()) || r.toLowerCase().includes('national') || r.toLowerCase().includes('nationwide'));
                if (!matchesState && !rec.reasons.some(r => r.includes('Central initiative'))) {
                    console.warn(`⚠️ Mismatch warning: recommended scheme ${rec.schemeId} may violate state filter!`);
                    eligibilityViolationsCount++;
                }
            }
        });
    }
    // Calculate stats
    const count = TEST_CASES.length;
    const recallAt5 = (successfulRetrievalsAt5 / count) * 100;
    const recallAt10 = (successfulRetrievalsAt10 / count) * 100;
    const mrr = totalReciprocalRank / count;
    const avgLatency = totalE2ELatency / count;
    const eligibilityAccuracy = ((count - eligibilityViolationsCount) / count) * 100;
    console.log('\n======================================');
    console.log('       EVALUATION METRICS SUMMARY     ');
    console.log('======================================');
    console.log(`Recall@5:                ${recallAt5.toFixed(1)}%  (Target: >90%)`);
    console.log(`Recall@10:               ${recallAt10.toFixed(1)}% (Target: >95%)`);
    console.log(`MRR (Mean Recip Rank):   ${mrr.toFixed(3)}   (Target: >0.80)`);
    console.log(`Eligibility Accuracy:    ${eligibilityAccuracy.toFixed(1)}%`);
    console.log(`Average E2E Latency:     ${avgLatency.toFixed(0)}ms  (Target: <2000ms)`);
    console.log('======================================\n');
    process.exit(0);
}
runEvaluation();
