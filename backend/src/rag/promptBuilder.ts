/**
 * promptBuilder.ts
 * Builds LLM prompts for:
 *   1. Scheme recommendation reports
 *   2. Application summaries
 *
 * Language is injected at the TOP of every prompt via LANGUAGE_INSTRUCTION,
 * forcing the LLM to reply in the user's selected language.
 */
import { CitizenProfile } from '../profile/profileExtractor';
import { SchemeDocument } from '../ingestion/normalizer';
import { EligibilityResult } from '../recommendation/scoringRules';
import { SupportedLanguage, LANGUAGE_INSTRUCTION } from '../i18n/backendStrings';

export interface ScoredScheme {
  scheme: SchemeDocument;
  eligibility: EligibilityResult;
}

export function buildRecommendationPrompt(
  profile: CitizenProfile,
  scoredSchemes: ScoredScheme[],
  language: SupportedLanguage = 'en'
): string {
  const profileSummary = `
Applicant Profile:
- Name: ${profile.name || 'Unknown'}
- Age: ${profile.age !== null ? profile.age : 'Unknown'}
- Gender: ${profile.gender || 'Unknown'}
- State: ${profile.state || 'Unknown'}
- Annual Family Income: ${profile.income !== null ? `₹${profile.income.toLocaleString('en-IN')}` : 'Unknown'}
- Occupation: ${profile.occupation || 'Unknown'}
- Marital Status: ${profile.maritalStatus || 'Unknown'}
- Category: ${profile.category || 'Unknown'}
- Disability Status: ${profile.disabilityStatus === true ? 'Yes' : profile.disabilityStatus === false ? 'No' : 'Unknown'}
  `.trim();

  const schemesContext = scoredSchemes.map((ss, index) => {
    const s = ss.scheme;
    const el = ss.eligibility;
    return `
${index + 1}. SCHEME: ${s.schemeName}
- Eligibility Score: ${el.score}
- Details: ${s.details}
- Benefits: ${s.benefits}
- Eligibility Criteria: ${s.eligibility}
- Required Documents: ${s.documents}
- Application Process: ${s.application}
- Matching Reasons:
${el.reasons.map((r: string) => `  * ${r}`).join('\n')}
    `.trim();
  }).join('\n\n---\n\n');

  // Language instruction is prepended — this is the key change
  return `
${LANGUAGE_INSTRUCTION[language]}

You are an expert government welfare advisor named Sahayak AI.
Your task is to write a highly professional, compassionate, and clear recommendation report for an NGO caseworker sitting with the applicant.

Here is the applicant's profile:
${profileSummary}

Here are the top schemes matched by our deterministic engine:
${schemesContext}

INSTRUCTIONS:
1. Explain why each scheme is recommended based on the applicant's profile and matching reasons.
2. Present the benefits clearly, emphasizing what the applicant will receive.
3. List the required documents and outline the application steps exactly as they appear in the database.
4. DO NOT make up any benefits, requirements, or application processes. Rely strictly on the database context provided above.
5. If there is insufficient information for a scheme, state that clearly.
6. Write in a clear, structured format. Use sections for each scheme with clear headings and bullet points.
  `.trim();
}

export function buildApplicationSummaryPrompt(
  session: {
    profile: CitizenProfile;
    applicationAnswers: Record<string, any>;
    formConfig: any;
    selectedSchemeName: string | null;
  },
  scheme: SchemeDocument,
  formattedAnswers: string,
  language: SupportedLanguage = 'en'
): string {
  const profile = session.profile;

  const systemPrompt = `
${LANGUAGE_INSTRUCTION[language]}

You are a senior caseworker assistant. Your task is to compile a professional Application Briefing Document for an NGO worker to process a citizen's welfare scheme application.
Rely strictly on the provided scheme details and applicant answers. Do not make up facts or instructions.
  `.trim();

  const userPrompt = `
Generate a professional, NGO-friendly casework summary document for the following application:

SCHEME DETAILS:
- Scheme Name: ${scheme.schemeName}
- Level: ${scheme.level}
- Required Documents: ${scheme.documents}
- Application Process: ${scheme.application}

APPLICANT PROFILE:
- Name: ${profile.name || 'N/A'}
- Age: ${profile.age || 'N/A'}
- State: ${profile.state || 'N/A'}
- Family Income: ₹${profile.income ? profile.income.toLocaleString('en-IN') : 'N/A'}

COLLECTED APPLICATION ANSWERS:
${formattedAnswers}

OUTPUT STRUCTURE:
Please write a structured report containing:
1. Application Overview Summary
2. Eligibility Verification
3. Required Document Checklist
4. Missing Information / Discrepancies (if any)
5. Recommended Next Steps
  `.trim();

  return JSON.stringify({ systemPrompt, userPrompt });
}
