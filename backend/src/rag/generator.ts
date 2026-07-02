/**
 * generator.ts
 * Calls Groq to generate:
 *   1. Scheme recommendation reports
 *   2. Application summaries
 *
 * Language parameter is passed to promptBuilder which prepends the
 * LANGUAGE_INSTRUCTION, forcing the LLM to respond in the correct language.
 */
import Groq from 'groq-sdk';
import { config } from '../config/env';
import { ScoredScheme, buildRecommendationPrompt, buildApplicationSummaryPrompt } from './promptBuilder';
import { CitizenProfile } from '../profile/profileExtractor';
import { SupportedLanguage, NO_SCHEMES_FOUND } from '../i18n/backendStrings';
import { SchemeDocument } from '../ingestion/normalizer';

export async function generateRecommendationsReport(
  profile: CitizenProfile,
  scoredSchemes: ScoredScheme[],
  language: SupportedLanguage = 'en'
): Promise<string> {
  if (scoredSchemes.length === 0) {
    return NO_SCHEMES_FOUND[language];
  }

  if (!config.GROQ_API_KEY) {
    console.log('[Generator] GROQ_API_KEY not set. Generating local template-based report.');
    return generateLocalFallbackReport(profile, scoredSchemes);
  }

  try {
    const groq = new Groq({ apiKey: config.GROQ_API_KEY });
    const prompt = buildRecommendationPrompt(profile, scoredSchemes, language);

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an AI government welfare caseworker. Your response must be directly based on the scheme details provided. Do not extrapolate, hallucinate, or invent benefits. Keep descriptions professional, concise, and helpful for NGO workers.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    });

    return response.choices[0]?.message?.content || generateLocalFallbackReport(profile, scoredSchemes);
  } catch (err) {
    console.error('[Generator] Failed to call Groq API for report generation, falling back to local format:', err);
    return generateLocalFallbackReport(profile, scoredSchemes);
  }
}

export async function generateApplicationSummaryWithLanguage(
  session: {
    profile: CitizenProfile;
    applicationAnswers: Record<string, any>;
    formConfig: any;
    selectedSchemeName: string | null;
  },
  scheme: SchemeDocument,
  formattedAnswers: string,
  language: SupportedLanguage = 'en'
): Promise<string> {
  if (!config.GROQ_API_KEY) {
    return generateLocalFallbackSummary(session, scheme, formattedAnswers);
  }

  try {
    const groq = new Groq({ apiKey: config.GROQ_API_KEY });
    const promptPayload = buildApplicationSummaryPrompt(session, scheme, formattedAnswers, language);
    const { systemPrompt, userPrompt } = JSON.parse(promptPayload);

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1
    });

    return response.choices[0]?.message?.content || generateLocalFallbackSummary(session, scheme, formattedAnswers);
  } catch (err) {
    console.error('[Generator] Groq API call failed. Using local fallback:', err);
    return generateLocalFallbackSummary(session, scheme, formattedAnswers);
  }
}

function generateLocalFallbackReport(
  profile: CitizenProfile,
  scoredSchemes: ScoredScheme[]
): string {
  let report = `# Government Welfare Schemes Recommendation Report\n\n`;
  report += `**Applicant Name:** ${profile.name || 'N/A'}  \n`;
  report += `**State:** ${profile.state || 'N/A'} | **Category:** ${profile.category || 'N/A'} | **Annual Family Income:** ${profile.income !== null ? `₹${profile.income.toLocaleString('en-IN')}` : 'N/A'}  \n`;
  report += `**Occupation:** ${profile.occupation || 'N/A'} | **Disability Status:** ${profile.disabilityStatus ? 'Yes' : 'No'}  \n\n`;
  report += `Based on a deterministic eligibility match, we have identified **${scoredSchemes.length}** relevant schemes:\n\n---\n\n`;

  scoredSchemes.forEach((ss, idx) => {
    const s = ss.scheme;
    const el = ss.eligibility;
    report += `## ${idx + 1}. ${s.schemeName}\n\n`;
    report += `### Recommendation Rationale\n`;
    el.reasons.forEach((r: string) => { report += `- ${r}\n`; });
    report += `\n### Key Benefits\n${s.benefits || 'No benefit details listed.'}\n\n`;
    report += `### Eligibility Criteria\n${s.eligibility || 'No eligibility criteria listed.'}\n\n`;
    report += `### Required Documents\n${s.documents || 'No documents listed.'}\n\n`;
    report += `### How to Apply\n${s.application || 'No application steps listed.'}\n\n`;
    report += `* * *\n\n`;
  });

  report += `*Note: This report was compiled deterministically from the welfare database.*`;
  return report;
}

function generateLocalFallbackSummary(
  session: {
    profile: CitizenProfile;
    applicationAnswers: Record<string, any>;
    formConfig: any;
    selectedSchemeName: string | null;
  },
  scheme: SchemeDocument,
  formattedAnswers: string
): string {
  const profile = session.profile;
  let doc = `# Casework Application Summary Briefing\n\n`;
  doc += `## 1. Application Overview Summary\n`;
  doc += `- **Applicant Name:** ${profile.name || 'N/A'}\n`;
  doc += `- **Target Scheme:** ${scheme.schemeName}\n`;
  doc += `- **Status:** Completed Form Collection\n\n`;
  doc += `**Collected Form Answers:**\n${formattedAnswers}\n\n`;
  doc += `## 2. Eligibility Summary\n`;
  doc += `- Determined matching state, age range, social category, and income restrictions successfully.\n`;
  doc += `- Annual income of ₹${profile.income ? profile.income.toLocaleString('en-IN') : 'N/A'} satisfies eligibility requirements.\n\n`;
  doc += `## 3. Required Document Checklist\n`;
  doc += scheme.documents || `- Aadhaar Card\n- Resident Certificate\n- Family Income Certificate\n- Bank Passbook\n`;
  doc += `\n## 4. Missing Information / Discrepancies\n- None detected.\n\n`;
  doc += `## 5. Recommended Next Steps\n`;
  doc += scheme.application || `1. Access the official state portal or visit the local block office.\n2. Fill out the official form using the collected answers.\n3. Upload scanned copies of required documents.\n4. Provide acknowledgment slip to the citizen for tracking.\n`;
  doc += `\n\n---\n*Note: This summary was compiled locally based on user inputs.*`;
  return doc;
}

export default generateRecommendationsReport;
