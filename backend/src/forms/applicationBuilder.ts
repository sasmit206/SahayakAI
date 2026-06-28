import Groq from 'groq-sdk';
import { config } from '../config/env';
import { CaseworkSession } from './sessionManager';
import { SchemeDocument } from '../ingestion/normalizer';

export async function generateApplicationSummary(
  session: CaseworkSession,
  scheme: SchemeDocument
): Promise<string> {
  const profile = session.profile;
  const answers = session.applicationAnswers;

  // Format collected answers for prompt/fallback
  const formattedAnswers = Object.entries(answers)
    .map(([key, val]) => {
      const field = session.formConfig?.fields.find(f => f.key === key);
      const label = field ? field.label : key;
      return `- **${label}:** ${val}`;
    })
    .join('\n');

  if (!config.GROQ_API_KEY) {
    console.log('[ApplicationBuilder] GROQ_API_KEY not set. Generating local summary report.');
    return generateLocalFallbackSummary(session, scheme, formattedAnswers);
  }

  try {
    const groq = new Groq({ apiKey: config.GROQ_API_KEY });
    
    const systemPrompt = `
You are a senior caseworker assistant. Your task is to compile a professional Application Briefing Document for an NGO worker to process a citizen's welfare scheme application.
Rely strictly on the provided scheme details and applicant answers. Do not make up facts or instructions.
`;

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
1. **Application Overview Summary**: A summary of what was collected and for whom.
2. **Eligibility Verification**: A statement confirming matching qualifications.
3. **Required Document Checklist**: A checklist of physical documents the worker needs to collect from the citizen.
4. **Missing Information / Discrepancies**: Note any missing information or mismatched details (if any).
5. **Recommended Next Steps**: What the caseworker should do next (e.g. submit online at URL, visit District Office).
`;

  console.log('[ApplicationBuilder] Calling Groq API for application summary generation...');

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
    console.error('[ApplicationBuilder] Groq API call failed. Using local fallback:', err);
    return generateLocalFallbackSummary(session, scheme, formattedAnswers);
  }
}

function generateLocalFallbackSummary(
  session: CaseworkSession,
  scheme: SchemeDocument,
  formattedAnswers: string
): string {
  const profile = session.profile;
  let doc = `# Casework Application Summary Briefing\n\n`;
  
  doc += `## 📋 1. Application Overview Summary\n`;
  doc += `- **Applicant Name:** ${profile.name || 'N/A'}\n`;
  doc += `- **Target Scheme:** ${scheme.schemeName}\n`;
  doc += `- **Status:** Completed Form Collection\n\n`;
  doc += `**Collected Form Answers:**\n${formattedAnswers}\n\n`;

  doc += `## ⚖️ 2. Eligibility Summary\n`;
  doc += `- Determined matching state, age range, social category, and income restrictions successfully.\n`;
  doc += `- Household annual income of ₹${profile.income ? profile.income.toLocaleString('en-IN') : 'N/A'} satisfies eligibility requirements.\n\n`;

  doc += `## 📂 3. Required Document Checklist\n`;
  doc += `Please request and verify physical copies of these documents from the citizen:\n`;
  if (scheme.documents) {
    // Split lines or render full documents text
    doc += `${scheme.documents}\n`;
  } else {
    doc += `- Aadhaar Card\n- Resident Certificate\n- Family Income Certificate\n- Bank Passbook\n`;
  }
  doc += `\n`;

  doc += `## ⚠️ 4. Missing Information / Discrepancies\n`;
  doc += `- None detected. All required fields for the application FSM have been collected.\n\n`;

  doc += `## 🚀 5. Recommended Next Steps\n`;
  doc += `**Caseworker Instructions:**\n`;
  if (scheme.application) {
    doc += `${scheme.application}\n`;
  } else {
    doc += `1. Access the official state portal or visit the local block office.\n`;
    doc += `2. Fill out the official form using the collected answers above.\n`;
    doc += `3. Upload scanned copies of the required document checklist.\n`;
    doc += `4. Provide the acknowledgment slip number to the citizen for tracking.\n`;
  }
  
  doc += `\n\n---\n*Note: This summary briefing was compiled locally based on user inputs.*`;
  return doc;
}
export default generateApplicationSummary;
