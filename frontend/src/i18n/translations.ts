/**
 * i18n translations for SahayakAI
 * Add new languages by adding a new key to the `translations` object.
 * All UI labels must be present in every language entry.
 */

export type Language = 'en' | 'hi';

export interface Translations {
  // Header
  appName: string;
  appSubtitle: string;
  backLabel: string;
  versionLabel: string;
  engineLabel: string;

  // Chat Panel
  chatTitle: string;
  chatSubtitle: string;
  chatEmptyTitle: string;
  chatEmptyBody: string;
  chatPlaceholder: string;
  resetLabel: string;

  // Profile Panel
  profileTitle: string;
  profileSubtitle: string;
  profileMissingFields: (n: number) => string;
  profileNotCaptured: string;
  profileRequired: string;
  profileCaptured: string;
  profileFields: Record<string, string>;

  // Recommendations Panel
  recTitle: string;
  recSubtitle: string;
  recEmpty: string;
  recApply: string;
  recApplying: string;

  // Application Flow Panel
  appFlowBack: string;
  appFlowSubtitle: string;
  appFlowSummarySubtitle: string;
  appFlowComplete: string;
  appFlowCompleteSubtitle: string;
  appFlowPreparing: string;
  appFlowAnswered: (n: number) => string;
  appFlowContinue: string;
  appFlowPrint: string;
  appFlowAnswersLabel: string;

  // Validation
  validAadhaar: string;
  invalidAadhaar: string;
  validPhone: string;
  invalidPhone: string;
  fieldRequired: string;
  invalidNumber: string;
  selectOption: string;

  // Init / Error states
  initTitle: string;
  initSubtitle: string;
  errorTitle: string;
  errorBody: string;
  errorRetry: string;

  // Language switcher
  languageLabel: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Sahayak AI',
    appSubtitle: 'Assessment workspace',
    backLabel: 'Back',
    versionLabel: 'v1 · CSV index',
    engineLabel: 'Deterministic engine',

    chatTitle: 'Casework assistant',
    chatSubtitle: 'Natural-language intake dialogue',
    chatEmptyTitle: 'Ready to begin intake',
    chatEmptyBody: "Type the citizen's story in your own words. Sahayak will extract a structured profile as you go.",
    chatPlaceholder: "Type the citizen's statement…",
    resetLabel: 'Reset',

    profileTitle: 'Citizen profile',
    profileSubtitle: 'Caseworker intake',
    profileMissingFields: (n) => `${n} field${n === 1 ? '' : 's'} still required`,
    profileNotCaptured: 'Not yet captured',
    profileRequired: 'Required',
    profileCaptured: 'Captured',
    profileFields: {
      name: 'Full name',
      age: 'Age',
      gender: 'Gender',
      state: 'Residing state',
      income: 'Annual income',
      occupation: 'Occupation',
      maritalStatus: 'Marital status',
      category: 'Social category',
      disabilityStatus: 'Disability',
    },

    recTitle: 'Scheme recommendations',
    recSubtitle: 'Matched to citizen profile',
    recEmpty: 'Recommendations will appear here once enough profile data is collected.',
    recApply: 'Apply',
    recApplying: 'Opening…',

    appFlowBack: 'Back',
    appFlowSubtitle: 'Deterministic application flow',
    appFlowSummarySubtitle: 'Application summary',
    appFlowComplete: 'Application complete',
    appFlowCompleteSubtitle: 'Summary report ready for review',
    appFlowPreparing: 'Preparing next question…',
    appFlowAnswered: (n) => `${n} answered`,
    appFlowContinue: 'Continue',
    appFlowPrint: 'Print',
    appFlowAnswersLabel: 'Answers captured',

    validAadhaar: 'Valid Aadhaar number',
    invalidAadhaar: 'Aadhaar must be exactly 12 digits',
    validPhone: 'Valid phone number',
    invalidPhone: 'Phone number must be exactly 10 digits',
    fieldRequired: 'This field is required',
    invalidNumber: 'Please enter a valid number',
    selectOption: 'Please select an option',

    initTitle: 'Initializing Sahayak AI',
    initSubtitle: 'Connecting to server and caching database index',
    errorTitle: 'Connection failure',
    errorBody: 'Unable to reach the Sahayak AI backend. Confirm the backend is running on port 5001 and retry.',
    errorRetry: 'Retry connection',

    languageLabel: 'Language',
  },

  hi: {
    appName: 'सहायक AI',
    appSubtitle: 'मूल्यांकन कार्यक्षेत्र',
    backLabel: 'वापस',
    versionLabel: 'v1 · CSV इंडेक्स',
    engineLabel: 'नियतात्मक इंजन',

    chatTitle: 'केसवर्क सहायक',
    chatSubtitle: 'प्राकृतिक भाषा संवाद',
    chatEmptyTitle: 'शुरू करने के लिए तैयार',
    chatEmptyBody: 'नागरिक की जानकारी अपने शब्दों में लिखें। सहायक स्वचालित रूप से प्रोफ़ाइल बनाएगा।',
    chatPlaceholder: 'नागरिक का विवरण यहाँ लिखें…',
    resetLabel: 'रीसेट',

    profileTitle: 'नागरिक प्रोफ़ाइल',
    profileSubtitle: 'केसवर्कर इनटेक',
    profileMissingFields: (n) => `${n} फ़ील्ड अभी भी आवश्यक ${n === 1 ? 'है' : 'हैं'}`,
    profileNotCaptured: 'अभी तक नहीं मिला',
    profileRequired: 'आवश्यक',
    profileCaptured: 'प्राप्त',
    profileFields: {
      name: 'पूरा नाम',
      age: 'आयु',
      gender: 'लिंग',
      state: 'राज्य',
      income: 'वार्षिक आय',
      occupation: 'व्यवसाय',
      maritalStatus: 'वैवाहिक स्थिति',
      category: 'सामाजिक श्रेणी',
      disabilityStatus: 'विकलांगता',
    },

    recTitle: 'योजना सुझाव',
    recSubtitle: 'नागरिक प्रोफ़ाइल के अनुसार',
    recEmpty: 'पर्याप्त प्रोफ़ाइल डेटा मिलने के बाद यहाँ सुझाव दिखेंगे।',
    recApply: 'आवेदन करें',
    recApplying: 'खुल रहा है…',

    appFlowBack: 'वापस',
    appFlowSubtitle: 'नियतात्मक आवेदन प्रक्रिया',
    appFlowSummarySubtitle: 'आवेदन सारांश',
    appFlowComplete: 'आवेदन पूर्ण',
    appFlowCompleteSubtitle: 'सारांश रिपोर्ट समीक्षा के लिए तैयार',
    appFlowPreparing: 'अगला प्रश्न तैयार हो रहा है…',
    appFlowAnswered: (n) => `${n} उत्तर दिए`,
    appFlowContinue: 'जारी रखें',
    appFlowPrint: 'प्रिंट',
    appFlowAnswersLabel: 'प्राप्त उत्तर',

    validAadhaar: 'वैध आधार नंबर',
    invalidAadhaar: 'आधार नंबर में ठीक 12 अंक होने चाहिए',
    validPhone: 'वैध फ़ोन नंबर',
    invalidPhone: 'फ़ोन नंबर में ठीक 10 अंक होने चाहिए',
    fieldRequired: 'यह फ़ील्ड आवश्यक है',
    invalidNumber: 'कृपया एक मान्य नंबर दर्ज करें',
    selectOption: 'कृपया एक विकल्प चुनें',

    initTitle: 'सहायक AI प्रारंभ हो रहा है',
    initSubtitle: 'सर्वर से कनेक्ट हो रहा है और डेटाबेस इंडेक्स लोड हो रहा है',
    errorTitle: 'कनेक्शन विफल',
    errorBody: 'सहायक AI बैकएंड तक पहुँचने में असमर्थ। सुनिश्चित करें कि बैकएंड पोर्ट 5001 पर चल रहा है।',
    errorRetry: 'पुनः प्रयास करें',

    languageLabel: 'भाषा',
  },
};

/**
 * Common chatbot response patterns to translate on the frontend.
 * These are fixed strings the backend sends — we match and replace them.
 * This is more reliable than asking Groq to always respond in Hindi,
 * since Groq can ignore language instructions for short structured responses.
 */
/**
 * Pattern-based chatbot message translator.
 * Uses keyword patterns instead of exact strings so any variation of a
 * question (with or without punctuation, casing, extra context) gets matched.
 *
 * Each rule has:
 *   - pattern: RegExp that matches the English message
 *   - hi: the Hindi translation to show instead
 *
 * To add a new language, add a new key alongside `hi` in each rule.
 */
interface TranslationRule {
  pattern: RegExp;
  hi: string;
}

const TRANSLATION_RULES: TranslationRule[] = [
  // Greeting
  {
    pattern: /Hello!.*Sahayak AI.*caseworker/i,
    hi: "नमस्ते! मैं सहायक AI हूँ, आपका केसवर्कर सहायक। आइए नागरिक की प्रोफ़ाइल समझने से शुरुआत करें। आप स्वाभाविक रूप से बोल सकते हैं, जैसे: 'मेरा नाम राम है, मैं बिहार का किसान हूँ, विवाहित हूँ और सालाना ₹90,000 कमाता हूँ।'",
  },
  // Profile complete / recommendations ready
  {
    pattern: /successfully compiled.*profile|identified.*welfare schemes|recommendations.*panel/i,
    hi: "मैंने सफलतापूर्वक नागरिक की प्रोफ़ाइल तैयार की है और उन शीर्ष कल्याण योजनाओं की पहचान की है जिनके लिए वे पात्र हैं। दाईं ओर के पैनल में सिफारिशें और रिपोर्ट देखें।",
  },
  // Error generating recommendations
  {
    pattern: /collected the profile.*error generating|encountered an error.*recommendations/i,
    hi: "मैंने प्रोफ़ाइल विवरण एकत्र किया है, लेकिन सिफारिशें तैयार करते समय एक त्रुटि हुई। कृपया अपना कनेक्शन जाँचें।",
  },
  // Application complete
  {
    pattern: /collected all.*application details|compiled.*Application Summary/i,
    hi: "बहुत अच्छा! मैंने सभी आवेदन विवरण एकत्र किए हैं और एक पेशेवर केसवर्क आवेदन सारांश तैयार किया है। कार्यक्षेत्र पैनल में इसे देखें।",
  },
  // Name
  {
    pattern: /citizen'?s (full )?name|tell me.*name/i,
    hi: "कृपया नागरिक का पूरा नाम बताएं?",
  },
  // Age
  {
    pattern: /applicant'?s age|what is.*age/i,
    hi: "आवेदक की उम्र क्या है?",
  },
  // Gender
  {
    pattern: /applicant'?s gender|male.*female.*other/i,
    hi: "आवेदक का लिंग क्या है? (पुरुष/महिला/अन्य)",
  },
  // State
  {
    pattern: /which state|applicant from.*state|state.*applicant/i,
    hi: "आवेदक किस राज्य से है?",
  },
  // Income
  {
    pattern: /annual.*income|family income|income.*rupees|income.*₹/i,
    hi: "आवेदक की वार्षिक पारिवारिक आय (₹ में) कितनी है?",
  },
  // Occupation
  {
    pattern: /applicant'?s occupation|what.*occupation|farmer.*student.*worker/i,
    hi: "आवेदक का व्यवसाय क्या है? (जैसे, किसान, छात्र, निर्माण मजदूर)",
  },
  // Marital status
  {
    pattern: /marital status|single.*married.*widowed/i,
    hi: "आवेदक की वैवाहिक स्थिति क्या है? (अविवाहित/विवाहित/विधवा/तलाकशुदा)",
  },
  // Category
  {
    pattern: /social category|general.*obc.*sc.*st|which category/i,
    hi: "आवेदक किस सामाजिक श्रेणी से है? (सामान्य, OBC, SC, ST)",
  },
  // Disability
  {
    pattern: /physical disability|disability.*yes.*no/i,
    hi: "क्या आवेदक को कोई शारीरिक विकलांगता है? (हाँ/नहीं)",
  },
  // Generic "more details" fallback
  {
    pattern: /provide more details|more information.*citizen/i,
    hi: "कृपया नागरिक के बारे में अधिक जानकारी प्रदान करें।",
  },
];

/**
 * Translates an assistant message to the target language at render time.
 * Because this runs on every render, switching language mid-conversation
 * immediately updates ALL existing messages — no refresh needed.
 *
 * Falls back to the original English if no pattern matches
 * (e.g. for free-form Groq-generated report text).
 */
export function translateChatbotMessage(message: string, language: Language): string {
  if (language === 'en') return message;

  for (const rule of TRANSLATION_RULES) {
    if (rule.pattern.test(message)) {
      const translation = rule[language as keyof Omit<TranslationRule, 'pattern'>];
      if (translation) return translation;
    }
  }

  // No pattern matched — return as-is (Groq-generated free text)
  return message;
}

/**
 * Scheme field translations for recommendation cards.
 * Translates common English terms that appear in scheme benefits/eligibility text.
 */
export const SCHEME_FIELD_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    // Level
    'Central': 'केंद्रीय',
    'State': 'राज्य',
    'District': 'जिला',
    // Common categories
    'Agriculture': 'कृषि',
    'Education': 'शिक्षा',
    'Health': 'स्वास्थ्य',
    'Housing': 'आवास',
    'Employment': 'रोजगार',
    'Social Welfare': 'सामाजिक कल्याण',
    'Women & Child': 'महिला एवं बाल',
    'Skills & Employment': 'कौशल एवं रोजगार',
    'Business & Entrepreneurship': 'व्यवसाय एवं उद्यमिता',
    'Financial Assistance': 'वित्तीय सहायता',
    // Apply button
    'Apply': 'आवेदन करें',
    'Opening…': 'खुल रहा है…',
    // Match score label
    'Match score': 'मिलान स्कोर',
    'Eligibility match': 'पात्रता मिलान',
    'No recommendations yet': 'अभी कोई सुझाव नहीं',
  },
};

/** Translate a scheme-related short string (level, category, label) */
export function translateSchemeField(value: string, language: Language): string {
  if (language === 'en') return value;
  return SCHEME_FIELD_TRANSLATIONS[language][value] ?? value;
}

/**
 * Form field label translations for the application flow.
 * Keys match the `label` and `placeholder` values in schemeFormConfigs.ts
 */
export const FORM_FIELD_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {},
  hi: {
    // Default form fields
    'Applicant Full Name': 'आवेदक का पूरा नाम',
    'Enter full name as on Aadhaar': 'आधार कार्ड पर जैसा नाम है वैसा लिखें',
    '12-Digit Aadhaar Number': '12 अंकों का आधार नंबर',
    '0000-0000-0000': '0000-0000-0000',
    'Mobile Number': 'मोबाइल नंबर',
    '10-digit mobile number': '10 अंकों का मोबाइल नंबर',
    'Bank Account Number': 'बैंक खाता नंबर',
    'Enter bank account number': 'बैंक खाता नंबर दर्ज करें',
    'Bank IFSC Code': 'बैंक IFSC कोड',
    'IFSC Code': 'IFSC कोड',
    'I verify that the information is correct and matches original documents': 'मैं पुष्टि करता/करती हूँ कि जानकारी सही है और मूल दस्तावेज़ों से मेल खाती है',
    // Scheme-specific fields
    'Name of the Deceased Brahmin': 'मृत ब्राह्मण का नाम',
    'Relationship with the Deceased': 'मृतक से संबंध',
    'Aadhaar Card of the Deceased': 'मृतक का आधार कार्ड',
    'Bank Account Number of Applicant': 'आवेदक का बैंक खाता नंबर',
    'Death Certificate Registration Number': 'मृत्यु प्रमाण पत्र पंजीकरण संख्या',
    'Full Name (as in Aadhaar)': 'पूरा नाम (आधार के अनुसार)',
    'Land Ownership Status': 'भूमि स्वामित्व स्थिति',
    'Yes (Owner)': 'हाँ (स्वामी)',
    'No (Tenant)': 'नहीं (किरायेदार)',
    'Marginal Farmer': 'सीमांत किसान',
    'Name of the Deceased Laborer': 'मृत श्रमिक का नाम',
    'Construction Site Address': 'निर्माण स्थल का पता',
    'Nominee / Legal Heir Name': 'नामांकित / कानूनी उत्तराधिकारी का नाम',
    'Aadhaar Card of Nominee': 'नामांकित का आधार कार्ड',
    'Bank Account Details of Nominee': 'नामांकित का बैंक खाता विवरण',
    // Choices
    'Spouse': 'पति/पत्नी', 'Son': 'पुत्र', 'Daughter': 'पुत्री',
    'Parent': 'माता-पिता', 'Brother': 'भाई', 'Grandson': 'पोता',
    'Yes': 'हाँ', 'No': 'नहीं',
  },
};

/** Translate a form field label or placeholder */
export function translateFormField(value: string, language: Language): string {
  if (language === 'en') return value;
  return FORM_FIELD_TRANSLATIONS[language][value] ?? value;
}
