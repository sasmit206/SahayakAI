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

  // Voice (speech-to-text / text-to-speech)
  micStart: string;
  micStop: string;
  micListening: string;
  micUnsupported: string;
  speakerOn: string;
  speakerOff: string;
  micPermissionDenied: string;
  playMessage: string;
  stopPlaying: string;

  // Hindi transliteration + virtual keyboard
  transliterateHint: string;
  keyboardToggle: string;
  keyboardSpace: string;
  keyboardBackspace: string;
  keyboardClear: string;
  keyboardClose: string;

  // Quick-reply chat fields (gender/marital/category/disability/state)
  selectStatePlaceholder: string;
  chooseOption: string;
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

    micStart: 'Speak',
    micStop: 'Stop',
    micListening: 'Listening…',
    micUnsupported: 'Voice input not supported in this browser',
    speakerOn: 'Voice replies on',
    speakerOff: 'Voice replies off',
    micPermissionDenied: 'Microphone access denied. Allow it in browser settings.',
    playMessage: 'Play',
    stopPlaying: 'Stop',

    transliterateHint: 'Tab to convert to Hindi script',
    keyboardToggle: 'Hindi keyboard',
    keyboardSpace: 'Space',
    keyboardBackspace: 'Backspace',
    keyboardClear: 'Clear',
    keyboardClose: 'Close',

    selectStatePlaceholder: 'Select a state…',
    chooseOption: 'Choose one:',
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

    micStart: 'बोलें',
    micStop: 'रोकें',
    micListening: 'सुन रहा है…',
    micUnsupported: 'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है',
    speakerOn: 'आवाज़ जवाब चालू',
    speakerOff: 'आवाज़ जवाब बंद',
    micPermissionDenied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग्स में अनुमति दें।',
    playMessage: 'सुनें',
    stopPlaying: 'रोकें',

    transliterateHint: 'हिंदी लिपि में बदलने के लिए Tab दबायें',
    keyboardToggle: 'हिंदी कीबोर्ड',
    keyboardSpace: 'स्पेस',
    keyboardBackspace: 'बैकस्पेस',
    keyboardClear: 'साफ़ करें',
    keyboardClose: 'बंद करें',

    selectStatePlaceholder: 'राज्य चुनें…',
    chooseOption: 'एक विकल्प चुनें:',
  },
};
