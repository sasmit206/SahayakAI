import Groq from 'groq-sdk';
import { config } from '../config/env';
import { CaseworkSession } from './sessionManager';
import { SchemeDocument } from '../ingestion/normalizer';
import { Lang } from '../i18n/botStrings';

export async function generateApplicationSummary(
  session: CaseworkSession,
  scheme: SchemeDocument
): Promise<string> {
  const profile = session.profile;
  const answers = session.applicationAnswers;
  const language: Lang = session.language || 'en';

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
    return generateLocalFallbackSummary(session, scheme, formattedAnswers, language);
  }

  try {
    const groq = new Groq({ apiKey: config.GROQ_API_KEY });
    const languageInstruction = language === 'hi'
      ? ' Write your entire response in Hindi (Devanagari script).'
      : language === 'kn'
      ? ' Write your entire response in Kannada (Kannada script).'
      : ' Write your entire response in English.';

    const systemPrompt = `
You are a senior caseworker assistant. Your task is to compile a professional Application Briefing Document for an NGO worker to process a citizen's welfare scheme application.
Rely strictly on the provided scheme details and applicant answers. Do not make up facts or instructions.${languageInstruction}
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

    return response.choices[0]?.message?.content || generateLocalFallbackSummary(session, scheme, formattedAnswers, language);
  } catch (err) {
    console.error('[ApplicationBuilder] Groq API call failed. Using local fallback:', err);
    return generateLocalFallbackSummary(session, scheme, formattedAnswers, language);
  }
}

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Casework Application Summary Briefing', overview: 'Application Overview Summary',
    name: 'Applicant Name', target: 'Target Scheme', status: 'Status', statusVal: 'Completed Form Collection',
    answers: 'Collected Form Answers', eligibility: 'Eligibility Summary',
    eligNote: 'Determined matching state, age range, social category, and income restrictions successfully.',
    incomeNote: 'Household annual income of', satisfies: 'satisfies eligibility requirements.',
    documents: 'Required Document Checklist', docsIntro: 'Please request and verify physical copies of these documents from the citizen:',
    defaultDocs: '- Aadhaar Card\n- Resident Certificate\n- Family Income Certificate\n- Bank Passbook',
    missing: 'Missing Information / Discrepancies', noMissing: 'None detected. All required fields for the application FSM have been collected.',
    nextSteps: 'Recommended Next Steps', instructions: 'Caseworker Instructions',
    defaultSteps: '1. Access the official state portal or visit the local block office.\n2. Fill out the official form using the collected answers above.\n3. Upload scanned copies of the required document checklist.\n4. Provide the acknowledgment slip number to the citizen for tracking.',
    note: 'Note: This summary briefing was compiled locally based on user inputs.', na: 'N/A',
  },
  hi: {
    title: 'केसवर्क आवेदन सारांश ब्रीफिंग', overview: 'आवेदन अवलोकन सारांश',
    name: 'आवेदक का नाम', target: 'लक्षित योजना', status: 'स्थिति', statusVal: 'फॉर्म संग्रह पूर्ण',
    answers: 'एकत्रित फॉर्म उत्तर', eligibility: 'पात्रता सारांश',
    eligNote: 'राज्य, आयु सीमा, सामाजिक श्रेणी और आय सीमाओं का सफलतापूर्वक मिलान किया गया।',
    incomeNote: 'परिवार की वार्षिक आय', satisfies: 'पात्रता आवश्यकताओं को पूरा करती है।',
    documents: 'आवश्यक दस्तावेज़ सूची', docsIntro: 'कृपया नागरिक से इन दस्तावेज़ों की भौतिक प्रतियां प्राप्त करें और सत्यापित करें:',
    defaultDocs: '- आधार कार्ड\n- निवास प्रमाण पत्र\n- परिवार आय प्रमाण पत्र\n- बैंक पासबुक',
    missing: 'लापता जानकारी / विसंगतियां', noMissing: 'कोई नहीं मिला। आवेदन के सभी आवश्यक फ़ील्ड एकत्र किए जा चुके हैं।',
    nextSteps: 'अनुशंसित अगले चरण', instructions: 'केसवर्कर निर्देश',
    defaultSteps: '1. आधिकारिक राज्य पोर्टल पर जाएं या स्थानीय ब्लॉक कार्यालय जाएं।\n2. ऊपर एकत्रित उत्तरों का उपयोग करके आधिकारिक फॉर्म भरें।\n3. आवश्यक दस्तावेज़ों की स्कैन की हुई प्रतियां अपलोड करें।\n4. ट्रैकिंग के लिए नागरिक को पावती पर्ची संख्या प्रदान करें।',
    note: 'नोट: यह सारांश ब्रीफिंग उपयोगकर्ता इनपुट के आधार पर स्थानीय रूप से तैयार की गई है।', na: 'उपलब्ध नहीं',
  },
  kn: {
    title: 'ಕೇಸ್‌ವರ್ಕ್ ಅರ್ಜಿ ಸಾರಾಂಶ ಬ್ರೀಫಿಂಗ್', overview: 'ಅರ್ಜಿ ಅವಲೋಕನ ಸಾರಾಂಶ',
    name: 'ಅರ್ಜಿದಾರರ ಹೆಸರು', target: 'ಗುರಿ ಯೋಜನೆ', status: 'ಸ್ಥಿತಿ', statusVal: 'ಫಾರ್ಮ್ ಸಂಗ್ರಹ ಪೂರ್ಣಗೊಂಡಿದೆ',
    answers: 'ಸಂಗ್ರಹಿಸಿದ ಫಾರ್ಮ್ ಉತ್ತರಗಳು', eligibility: 'ಅರ್ಹತಾ ಸಾರಾಂಶ',
    eligNote: 'ರಾಜ್ಯ, ವಯಸ್ಸಿನ ಮಿತಿ, ಸಾಮಾಜಿಕ ವರ್ಗ ಮತ್ತು ಆದಾಯ ಮಿತಿಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಹೊಂದಿಸಲಾಗಿದೆ.',
    incomeNote: 'ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ', satisfies: 'ಅರ್ಹತಾ ಅವಶ್ಯಕತೆಗಳನ್ನು ಪೂರೈಸುತ್ತದೆ.',
    documents: 'ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪಟ್ಟಿ', docsIntro: 'ದಯವಿಟ್ಟು ನಾಗರಿಕರಿಂದ ಈ ದಾಖಲೆಗಳ ಭೌತಿಕ ಪ್ರತಿಗಳನ್ನು ಕೋರಿ ಪರಿಶೀಲಿಸಿ:',
    defaultDocs: '- ಆಧಾರ್ ಕಾರ್ಡ್\n- ನಿವಾಸ ಪ್ರಮಾಣಪತ್ರ\n- ಕುಟುಂಬ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ\n- ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್',
    missing: 'ಕಾಣೆಯಾದ ಮಾಹಿತಿ / ವ್ಯತ್ಯಾಸಗಳು', noMissing: 'ಯಾವುದೂ ಪತ್ತೆಯಾಗಿಲ್ಲ. ಅರ್ಜಿಗೆ ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಸಂಗ್ರಹಿಸಲಾಗಿದೆ.',
    nextSteps: 'ಶಿಫಾರಸು ಮಾಡಿದ ಮುಂದಿನ ಹಂತಗಳು', instructions: 'ಕೇಸ್‌ವರ್ಕರ್ ಸೂಚನೆಗಳು',
    defaultSteps: '1. ಅಧಿಕೃತ ರಾಜ್ಯ ಪೋರ್ಟಲ್ ಅನ್ನು ಪ್ರವೇಶಿಸಿ ಅಥವಾ ಸ್ಥಳೀಯ ಬ್ಲಾಕ್ ಕಚೇರಿಗೆ ಭೇಟಿ ನೀಡಿ.\n2. ಮೇಲಿನ ಸಂಗ್ರಹಿಸಿದ ಉತ್ತರಗಳನ್ನು ಬಳಸಿ ಅಧಿಕೃತ ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ.\n3. ಅಗತ್ಯ ದಾಖಲೆಗಳ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ಪ್ರತಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.\n4. ಟ್ರ್ಯಾಕಿಂಗ್‌ಗಾಗಿ ನಾಗರಿಕರಿಗೆ ಸ್ವೀಕೃತಿ ಸ್ಲಿಪ್ ಸಂಖ್ಯೆಯನ್ನು ಒದಗಿಸಿ.',
    note: 'ಗಮನಿಸಿ: ಈ ಸಾರಾಂಶ ಬ್ರೀಫಿಂಗ್ ಅನ್ನು ಬಳಕೆದಾರರ ಇನ್‌ಪುಟ್‌ಗಳ ಆಧಾರದ ಮೇಲೆ ಸ್ಥಳೀಯವಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.', na: 'ಲಭ್ಯವಿಲ್ಲ',
  },
};

function generateLocalFallbackSummary(
  session: CaseworkSession,
  scheme: SchemeDocument,
  formattedAnswers: string,
  language: Lang
): string {
  const profile = session.profile;
  const L = LABELS[language];
  let doc = `# ${L.title}\n\n`;

  doc += `## 📋 1. ${L.overview}\n`;
  doc += `- **${L.name}:** ${profile.name || L.na}\n`;
  doc += `- **${L.target}:** ${scheme.schemeName}\n`;
  doc += `- **${L.status}:** ${L.statusVal}\n\n`;
  doc += `**${L.answers}:**\n${formattedAnswers}\n\n`;

  doc += `## ⚖️ 2. ${L.eligibility}\n`;
  doc += `- ${L.eligNote}\n`;
  doc += `- ${L.incomeNote} ₹${profile.income ? profile.income.toLocaleString('en-IN') : L.na} ${L.satisfies}\n\n`;

  doc += `## 📂 3. ${L.documents}\n`;
  doc += `${L.docsIntro}\n`;
  if (scheme.documents) {
    doc += `${scheme.documents}\n`;
  } else {
    doc += `${L.defaultDocs}\n`;
  }
  doc += `\n`;

  doc += `## ⚠️ 4. ${L.missing}\n`;
  doc += `- ${L.noMissing}\n\n`;

  doc += `## 🚀 5. ${L.nextSteps}\n`;
  doc += `**${L.instructions}:**\n`;
  if (scheme.application) {
    doc += `${scheme.application}\n`;
  } else {
    doc += `${L.defaultSteps}\n`;
  }

  doc += `\n\n---\n*${L.note}*`;
  return doc;
}
export default generateApplicationSummary;
