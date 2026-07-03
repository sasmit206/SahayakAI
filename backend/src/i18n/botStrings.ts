import { CitizenProfile } from '../profile/profileExtractor';

export type Lang = 'en' | 'hi' | 'kn';

export function normalizeLang(input: unknown): Lang {
  if (input === 'hi') return 'hi';
  if (input === 'kn') return 'kn';
  return 'en';
}

const FIELD_QUESTIONS: Record<Lang, Record<keyof CitizenProfile, string>> = {
  en: {
    name: "Could you please tell me the citizen's name?",
    age: "What is the applicant's age?",
    gender: "What is the applicant's gender?",
    state: 'Which state is the applicant from?',
    income: "What is the applicant's annual family income (in ₹)?",
    occupation: "What is the applicant's occupation? (e.g., Farmer, Student, Construction Worker, etc.)",
    maritalStatus: "What is the applicant's marital status?",
    category: 'Which social category does the applicant belong to?',
    disabilityStatus: 'Does the applicant have any physical disability?',
  },
  hi: {
    name: 'कृपया नागरिक का नाम बताएं?',
    age: 'आवेदक की उम्र क्या है?',
    gender: 'आवेदक का लिंग क्या है?',
    state: 'आवेदक किस राज्य से है?',
    income: 'आवेदक के परिवार की वार्षिक आय क्या है (₹ में)?',
    occupation: 'आवेदक का व्यवसाय क्या है? (जैसे किसान, छात्र, निर्माण श्रमिक)',
    maritalStatus: 'आवेदक की वैवाहिक स्थिति क्या है?',
    category: 'आवेदक किस सामाजिक श्रेणी से है?',
    disabilityStatus: 'क्या आवेदक को कोई शारीरिक विकलांगता है?',
  },
  kn: {
    name: 'ದಯವಿಟ್ಟು ನಾಗರಿಕರ ಹೆಸರನ್ನು ತಿಳಿಸಿ?',
    age: 'ಅರ್ಜಿದಾರರ ವಯಸ್ಸು ಎಷ್ಟು?',
    gender: 'ಅರ್ಜಿದಾರರ ಲಿಂಗ ಯಾವುದು?',
    state: 'ಅರ್ಜಿದಾರರು ಯಾವ ರಾಜ್ಯದವರು?',
    income: 'ಅರ್ಜಿದಾರರ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು (₹ ನಲ್ಲಿ)?',
    occupation: 'ಅರ್ಜಿದಾರರ ಉದ್ಯೋಗ ಏನು? (ಉದಾ: ರೈತ, ವಿದ್ಯಾರ್ಥಿ, ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ)',
    maritalStatus: 'ಅರ್ಜಿದಾರರ ವೈವಾಹಿಕ ಸ್ಥಿತಿ ಏನು?',
    category: 'ಅರ್ಜಿದಾರರು ಯಾವ ಸಾಮಾಜಿಕ ವರ್ಗಕ್ಕೆ ಸೇರಿದವರು?',
    disabilityStatus: 'ಅರ್ಜಿದಾರರಿಗೆ ಯಾವುದೇ ದೈಹಿಕ ಅಂಗವೈಕಲ್ಯವಿದೆಯೇ?',
  },
};

// Display labels for the canonical option values (buttons/dropdown).
// Keys are the exact canonical strings stored on CitizenProfile — never translated themselves.
const OPTION_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    Male: 'Male', Female: 'Female', Other: 'Other',
    Single: 'Single', Married: 'Married', Widowed: 'Widowed', Divorced: 'Divorced',
    General: 'General', OBC: 'OBC', SC: 'SC', ST: 'ST',
    Yes: 'Yes', No: 'No',
  },
  hi: {
    Male: 'पुरुष', Female: 'महिला', Other: 'अन्य',
    Single: 'अविवाहित', Married: 'विवाहित', Widowed: 'विधवा/विधुर', Divorced: 'तलाकशुदा',
    General: 'सामान्य', OBC: 'ओबीसी', SC: 'अनुसूचित जाति (SC)', ST: 'अनुसूचित जनजाति (ST)',
    Yes: 'हाँ', No: 'नहीं',
  },
  kn: {
    Male: 'ಪುರುಷ', Female: 'ಮಹಿಳೆ', Other: 'ಇತರೆ',
    Single: 'ಅವಿವಾಹಿತ', Married: 'ವಿವಾಹಿತ', Widowed: 'ವಿಧವೆ/ವಿಧುರ', Divorced: 'ವಿಚ್ಛೇದಿತ',
    General: 'ಸಾಮಾನ್ಯ', OBC: 'ಒಬಿಸಿ', SC: 'ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC)', ST: 'ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ST)',
    Yes: 'ಹೌದು', No: 'ಇಲ್ಲ',
  },
};

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    askMore: 'Could you please provide more details about the citizen?',
    recsReady: "I have successfully compiled the citizen's profile and identified the top welfare schemes they qualify for. You can review the recommendations and report in the panel on the right.",
    recsError: 'I have collected the profile details, but encountered an error generating recommendations. Please check your vector database and connection.',
    noSchemesFound: "Based on the applicant's profile, no matching government schemes were found in our database.",
    applicationComplete: "Great! I have collected all the application details for **{scheme}** and compiled a professional Casework Application Summary briefing. You can review and print it in the workspace panel.",
    welcome: "Hello! I am Sahayak AI, your caseworker assistant. Let's start by understanding the citizen's profile. You can speak naturally, or write a statement like: 'I am Ram, a farmer from Bihar, married and earning ₹90,000 per year.'",
  },
  hi: {
    askMore: 'कृपया नागरिक के बारे में और जानकारी दें?',
    recsReady: 'मैंने नागरिक की प्रोफ़ाइल पूरी कर ली है और उनके लिए उपयुक्त कल्याण योजनाओं की पहचान की है। आप दाईं ओर के पैनल में सुझाव और रिपोर्ट देख सकते हैं।',
    recsError: 'मैंने प्रोफ़ाइल विवरण एकत्र कर लिया है, लेकिन सुझाव बनाने में त्रुटि हुई। कृपया अपना वेक्टर डेटाबेस और कनेक्शन जांचें।',
    noSchemesFound: 'आवेदक की प्रोफ़ाइल के आधार पर, हमारे डेटाबेस में कोई मेल खाती सरकारी योजना नहीं मिली।',
    applicationComplete: 'बहुत बढ़िया! मैंने **{scheme}** के लिए सभी आवेदन विवरण एकत्र कर लिए हैं और एक पेशेवर केसवर्क आवेदन सारांश तैयार किया है। आप इसे वर्कस्पेस पैनल में देख और प्रिंट कर सकते हैं।',
    welcome: 'नमस्ते! मैं सहायक AI हूँ, आपका केसवर्कर सहायक। आइए नागरिक की प्रोफ़ाइल समझना शुरू करें। आप स्वाभाविक रूप से बोल सकते हैं, या ऐसा कुछ लिख सकते हैं: "मैं राम हूँ, बिहार से एक किसान, विवाहित और ₹90,000 प्रति वर्ष कमाता हूँ।"',
  },
  kn: {
    askMore: 'ದಯವಿಟ್ಟು ನಾಗರಿಕರ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ನೀಡಿ?',
    recsReady: 'ನಾನು ನಾಗರಿಕರ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ ಮತ್ತು ಅವರಿಗೆ ಅರ್ಹವಾದ ಪ್ರಮುಖ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳನ್ನು ಗುರುತಿಸಿದ್ದೇನೆ. ನೀವು ಬಲಭಾಗದ ಪ್ಯಾನೆಲ್‌ನಲ್ಲಿ ಶಿಫಾರಸುಗಳು ಮತ್ತು ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.',
    recsError: 'ನಾನು ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಸಂಗ್ರಹಿಸಿದ್ದೇನೆ, ಆದರೆ ಶಿಫಾರಸುಗಳನ್ನು ರಚಿಸುವಾಗ ದೋಷ ಎದುರಾಯಿತು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ವೆಕ್ಟರ್ ಡೇಟಾಬೇಸ್ ಮತ್ತು ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
    noSchemesFound: 'ಅರ್ಜಿದಾರರ ಪ್ರೊಫೈಲ್ ಆಧಾರದ ಮೇಲೆ, ನಮ್ಮ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.',
    applicationComplete: 'ಅದ್ಭುತ! ನಾನು **{scheme}** ಗಾಗಿ ಎಲ್ಲಾ ಅರ್ಜಿ ವಿವರಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ ವೃತ್ತಿಪರ ಕೇಸ್‌ವರ್ಕ್ ಅರ್ಜಿ ಸಾರಾಂಶ ವರದಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ನೀವು ಇದನ್ನು ವರ್ಕ್‌ಸ್ಪೇಸ್ ಪ್ಯಾನೆಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಮುದ್ರಿಸಬಹುದು.',
    welcome: 'ನಮಸ್ಕಾರ! ನಾನು ಸಹಾಯಕ್ AI, ನಿಮ್ಮ ಕೇಸ್‌ವರ್ಕರ್ ಸಹಾಯಕ. ನಾಗರಿಕರ ಪ್ರೊಫೈಲ್ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವ ಮೂಲಕ ಪ್ರಾರಂಭಿಸೋಣ. ನೀವು ಸ್ವಾಭಾವಿಕವಾಗಿ ಮಾತನಾಡಬಹುದು ಅಥವಾ ಹೀಗೆ ಬರೆಯಬಹುದು: "ನಾನು ರಾಮ್, ಬಿಹಾರದ ರೈತ, ವಿವಾಹಿತ ಮತ್ತು ವರ್ಷಕ್ಕೆ ₹90,000 ಗಳಿಸುತ್ತೇನೆ."',
  },
};

export function questionFor(field: keyof CitizenProfile, lang: Lang): string {
  return FIELD_QUESTIONS[lang][field];
}

export function optionLabel(canonicalValue: string, lang: Lang): string {
  return OPTION_LABELS[lang][canonicalValue] ?? canonicalValue;
}

export function optionLabels(canonicalValues: string[], lang: Lang): { value: string; label: string }[] {
  return canonicalValues.map((v) => ({ value: v, label: optionLabel(v, lang) }));
}

export function botString(key: keyof typeof STRINGS.en, lang: Lang, vars?: Record<string, string>): string {
  let str = STRINGS[lang][key] ?? STRINGS.en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
  }
  return str;
}

export const LANGUAGE_NAME: Record<Lang, string> = { en: 'English', hi: 'Hindi', kn: 'Kannada' };
