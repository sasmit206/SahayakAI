"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_NAME = void 0;
exports.normalizeLang = normalizeLang;
exports.questionFor = questionFor;
exports.optionLabel = optionLabel;
exports.optionLabels = optionLabels;
exports.botString = botString;
function normalizeLang(input) {
    return input === 'hi' ? 'hi' : 'en';
}
const FIELD_QUESTIONS = {
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
};
// Display labels for the canonical option values (buttons/dropdown).
// Keys are the exact canonical strings stored on CitizenProfile — never translated themselves.
const OPTION_LABELS = {
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
};
const STRINGS = {
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
};
function questionFor(field, lang) {
    return FIELD_QUESTIONS[lang][field];
}
function optionLabel(canonicalValue, lang) {
    return OPTION_LABELS[lang][canonicalValue] ?? canonicalValue;
}
function optionLabels(canonicalValues, lang) {
    return canonicalValues.map((v) => ({ value: v, label: optionLabel(v, lang) }));
}
function botString(key, lang, vars) {
    let str = STRINGS[lang][key] ?? STRINGS.en[key];
    if (vars) {
        for (const [k, v] of Object.entries(vars))
            str = str.replace(`{${k}}`, v);
    }
    return str;
}
exports.LANGUAGE_NAME = { en: 'English', hi: 'Hindi' };
