"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecommendationsReport = generateRecommendationsReport;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const env_1 = require("../config/env");
const promptBuilder_1 = require("./promptBuilder");
async function generateRecommendationsReport(profile, scoredSchemes) {
    if (scoredSchemes.length === 0) {
        return "Based on the applicant's profile, no matching government schemes were found in our database.";
    }
    if (!env_1.config.GROQ_API_KEY) {
        console.log('[Generator] GROQ_API_KEY not set. Generating local template-based report.');
        return generateLocalFallbackReport(profile, scoredSchemes);
    }
    try {
        const groq = new groq_sdk_1.default({ apiKey: env_1.config.GROQ_API_KEY });
        const prompt = (0, promptBuilder_1.buildRecommendationPrompt)(profile, scoredSchemes);
        console.log('[Generator] Calling Groq API for report generation...');
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI government welfare caseworker. Your response must be directly based on the scheme details provided. Do not extrapolate, hallucinate, or invent benefits. Keep descriptions professional, concise, and helpful for NGO workers.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1
        });
        return response.choices[0]?.message?.content || generateLocalFallbackReport(profile, scoredSchemes);
    }
    catch (err) {
        console.error('[Generator] Failed to call Groq API for report generation, falling back to local format:', err);
        return generateLocalFallbackReport(profile, scoredSchemes);
    }
}
function generateLocalFallbackReport(profile, scoredSchemes) {
    let report = `# Government Welfare Schemes Recommendation Report\n\n`;
    report += `**Applicant Name:** ${profile.name || 'N/A'}  \n`;
    report += `**State:** ${profile.state || 'N/A'} | **Category:** ${profile.category || 'N/A'} | **Annual Family Income:** ${profile.income !== null ? `₹${profile.income.toLocaleString('en-IN')}` : 'N/A'}  \n`;
    report += `**Occupation:** ${profile.occupation || 'N/A'} | **Disability Status:** ${profile.disabilityStatus ? 'Yes' : 'No'}  \n\n`;
    report += `Based on a deterministic eligibility match, we have identified **${scoredSchemes.length}** relevant schemes:\n\n---\n\n`;
    scoredSchemes.forEach((ss, idx) => {
        const s = ss.scheme;
        const el = ss.eligibility;
        report += `## ${idx + 1}. ${s.schemeName}\n\n`;
        report += `### 💡 Recommendation Rationale\n`;
        el.reasons.forEach((r) => {
            report += `- ${r}\n`;
        });
        report += `\n`;
        report += `### 💰 Key Benefits\n`;
        report += `${s.benefits || 'No benefit details listed.'}\n\n`;
        report += `### 📝 Eligibility Criteria\n`;
        report += `${s.eligibility || 'No eligibility criteria listed.'}\n\n`;
        report += `### 📂 Required Documents\n`;
        report += `${s.documents || 'No documents listed.'}\n\n`;
        report += `### 🚀 How to Apply\n`;
        report += `${s.application || 'No application steps listed.'}\n\n`;
        report += `* * *\n\n`;
    });
    report += `*Note: This report was compiled deterministically from the welfare database.*`;
    return report;
}
exports.default = generateRecommendationsReport;
