"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecommendationsReport = generateRecommendationsReport;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const env_1 = require("../config/env");
const promptBuilder_1 = require("./promptBuilder");
const botStrings_1 = require("../i18n/botStrings");
async function generateRecommendationsReport(profile, scoredSchemes, language = 'en') {
    if (scoredSchemes.length === 0) {
        return (0, botStrings_1.botString)('noSchemesFound', language);
    }
    if (!env_1.config.GROQ_API_KEY) {
        console.log('[Generator] GROQ_API_KEY not set. Generating local template-based report.');
        return generateLocalFallbackReport(profile, scoredSchemes, language);
    }
    try {
        const groq = new groq_sdk_1.default({ apiKey: env_1.config.GROQ_API_KEY });
        const prompt = (0, promptBuilder_1.buildRecommendationPrompt)(profile, scoredSchemes);
        const languageInstruction = language === 'hi'
            ? ' Write your entire response in Hindi (Devanagari script).'
            : ' Write your entire response in English.';
        console.log('[Generator] Calling Groq API for report generation...');
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI government welfare caseworker. Your response must be directly based on the scheme details provided. Do not extrapolate, hallucinate, or invent benefits. Keep descriptions professional, concise, and helpful for NGO workers.' + languageInstruction
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1
        });
        return response.choices[0]?.message?.content || generateLocalFallbackReport(profile, scoredSchemes, language);
    }
    catch (err) {
        console.error('[Generator] Failed to call Groq API for report generation, falling back to local format:', err);
        return generateLocalFallbackReport(profile, scoredSchemes, language);
    }
}
const LABELS = {
    en: {
        title: 'Government Welfare Schemes Recommendation Report',
        applicant: 'Applicant Name', state: 'State', category: 'Category', income: 'Annual Family Income',
        occupation: 'Occupation', disability: 'Disability Status', yes: 'Yes', no: 'No', na: 'N/A',
        intro: 'Based on a deterministic eligibility match, we have identified', relevant: 'relevant schemes:',
        rationale: 'Recommendation Rationale', benefits: 'Key Benefits', eligibility: 'Eligibility Criteria',
        documents: 'Required Documents', apply: 'How to Apply', noBenefit: 'No benefit details listed.',
        noEligibility: 'No eligibility criteria listed.', noDocuments: 'No documents listed.', noApply: 'No application steps listed.',
        note: 'Note: This report was compiled deterministically from the welfare database.',
    },
    hi: {
        title: 'सरकारी कल्याण योजना सुझाव रिपोर्ट',
        applicant: 'आवेदक का नाम', state: 'राज्य', category: 'श्रेणी', income: 'वार्षिक परिवार आय',
        occupation: 'व्यवसाय', disability: 'विकलांगता स्थिति', yes: 'हाँ', no: 'नहीं', na: 'उपलब्ध नहीं',
        intro: 'निश्चित पात्रता मिलान के आधार पर, हमने', relevant: 'संबंधित योजनाएं पहचानी हैं:',
        rationale: 'सुझाव का कारण', benefits: 'मुख्य लाभ', eligibility: 'पात्रता मानदंड',
        documents: 'आवश्यक दस्तावेज़', apply: 'आवेदन कैसे करें', noBenefit: 'कोई लाभ विवरण सूचीबद्ध नहीं है।',
        noEligibility: 'कोई पात्रता मानदंड सूचीबद्ध नहीं है।', noDocuments: 'कोई दस्तावेज़ सूचीबद्ध नहीं है।', noApply: 'कोई आवेदन चरण सूचीबद्ध नहीं है।',
        note: 'नोट: यह रिपोर्ट कल्याण डेटाबेस से निश्चित रूप से तैयार की गई है।',
    },
};
function generateLocalFallbackReport(profile, scoredSchemes, language) {
    const L = LABELS[language];
    let report = `# ${L.title}\n\n`;
    report += `**${L.applicant}:** ${profile.name || L.na}  \n`;
    report += `**${L.state}:** ${profile.state || L.na} | **${L.category}:** ${profile.category || L.na} | **${L.income}:** ${profile.income !== null ? `₹${profile.income.toLocaleString('en-IN')}` : L.na}  \n`;
    report += `**${L.occupation}:** ${profile.occupation || L.na} | **${L.disability}:** ${profile.disabilityStatus ? L.yes : L.no}  \n\n`;
    report += `${L.intro} **${scoredSchemes.length}** ${L.relevant}\n\n---\n\n`;
    scoredSchemes.forEach((ss, idx) => {
        const s = ss.scheme;
        const el = ss.eligibility;
        report += `## ${idx + 1}. ${s.schemeName}\n\n`;
        report += `### 💡 ${L.rationale}\n`;
        el.reasons.forEach((r) => {
            report += `- ${r}\n`;
        });
        report += `\n`;
        report += `### 💰 ${L.benefits}\n`;
        report += `${s.benefits || L.noBenefit}\n\n`;
        report += `### 📝 ${L.eligibility}\n`;
        report += `${s.eligibility || L.noEligibility}\n\n`;
        report += `### 📂 ${L.documents}\n`;
        report += `${s.documents || L.noDocuments}\n\n`;
        report += `### 🚀 ${L.apply}\n`;
        report += `${s.application || L.noApply}\n\n`;
        report += `* * *\n\n`;
    });
    report += `*${L.note}*`;
    return report;
}
exports.default = generateRecommendationsReport;
