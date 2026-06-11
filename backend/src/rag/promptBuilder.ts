import { CitizenProfile } from '../profile/profileExtractor';
import { SchemeDocument } from '../ingestion/normalizer';
import { EligibilityResult } from '../recommendation/scoringRules';

export interface ScoredScheme {
  scheme: SchemeDocument;
  eligibility: EligibilityResult;
}

export function buildRecommendationPrompt(
  profile: CitizenProfile,
  scoredSchemes: ScoredScheme[]
): string {
  // Format profile information
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

  // Format retrieved schemes context
  const schemesContext = scoredSchemes.map((ss, index) => {
    const s = ss.scheme;
    const el = ss.eligibility;
    return `
${index + 1}. SCHEME: ${s.schemeName}
- Eligibility Score: ${el.score}
- Details: ${s.details}
- Benefits: ${s.benefits}
- Eligibility Criteria (Database): ${s.eligibility}
- Required Documents: ${s.documents}
- Application Process: ${s.application}
- Matching Reasons:
${el.reasons.map((r: string) => `  * ${r}`).join('\n')}
    `.trim();
  }).join('\n\n---\n\n');

  return `
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
5. If there is no sufficient information for a scheme or if there are gaps, state: "I could not find sufficient information in the available scheme database."
6. Write in a clear, structured markdown format. Use sections for each scheme with clear bolding and bullet points.
  `.trim();
}
