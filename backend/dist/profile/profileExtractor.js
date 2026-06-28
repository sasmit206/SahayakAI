"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_PROFILE = void 0;
exports.extractProfile = extractProfile;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const env_1 = require("../config/env");
exports.INITIAL_PROFILE = {
    name: null,
    age: null,
    gender: null,
    state: null,
    income: null,
    occupation: null,
    maritalStatus: null,
    category: null,
    disabilityStatus: null
};
// Helper to extract fields using general conversational regexes
function extractGeneralRegex(text, current) {
    const profile = { ...current };
    const lowerText = text.toLowerCase();
    // Name extraction (e.g. "I am Ram", "my name is Sita")
    // Captures up to two words to allow first + last name, then filters stop words
    const nameMatch = text.match(/(?:i\s+am|my\s+name\s+is|name\s+is|this\s+is)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
    if (nameMatch && nameMatch[1]) {
        const nameStr = nameMatch[1].trim();
        const stopWords = ['and', 'from', 'a', 'an', 'the', 'is', 'working', 'living', 'in', 'at', 'with'];
        const parts = nameStr.split(/\s+/);
        const filteredParts = [];
        for (const p of parts) {
            if (stopWords.includes(p.toLowerCase())) {
                break;
            }
            filteredParts.push(p);
        }
        if (filteredParts.length > 0) {
            profile.name = filteredParts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
    }
    // Age extraction (e.g. "52 years old", "age is 25", "i am 30", "30-year-old")
    const ageMatch = text.match(/(?:i\s+am|age\s+is|i'm)?\s*(\d{1,2})\s*(?:-|\s)*(?:years|yrs|year|yo\b)/i)
        || text.match(/age\s*(?::|is)\s*(\d{1,2})/i)
        || text.match(/\b(?:i\s+am|i'm)\s+(\d{1,2})\b/i);
    if (ageMatch && ageMatch[1]) {
        profile.age = parseInt(ageMatch[1], 10);
    }
    // Gender extraction
    if (lowerText.includes('female') || lowerText.includes('woman') || lowerText.includes('girl')) {
        profile.gender = 'Female';
    }
    else if (lowerText.includes('male') || lowerText.includes('man') || lowerText.includes('boy')) {
        profile.gender = 'Male';
    }
    else if (lowerText.includes('other gender') || (lowerText.includes('gender') && lowerText.includes('other'))) {
        profile.gender = 'Other';
    }
    // State extraction
    const states = [
        'bihar', 'rajasthan', 'uttar pradesh', 'madhya pradesh', 'karnataka', 'west bengal',
        'chhattisgarh', 'andhra pradesh', 'puducherry', 'kerala', 'maharashtra', 'gujarat',
        'punjab', 'haryana', 'tamil nadu', 'odisha', 'telangana', 'assam', 'jharkhand',
        'uttarakhand', 'himachal pradesh', 'delhi', 'goa', 'manipur', 'meghalaya', 'mizoram',
        'nagaland', 'sikkim', 'tripura', 'jammu and kashmir', 'ladakh'
    ];
    for (const s of states) {
        const regex = new RegExp('\\b' + s + '\\b', 'i');
        if (regex.test(lowerText)) {
            profile.state = s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            break;
        }
    }
    // Income extraction (e.g. "earn around ₹90,000", "income is 150000", "salary 90k")
    const incomeMatch = text.match(/(?:earn|income|earning|salary|salary\s+is|earns)(?:\s+around|\s+about)?\s*(?:rs\.?|₹)?\s*([\d,]+)\s*(k)?/i)
        || text.match(/income\s*:\s*(?:rs\.?|₹)?\s*([\d,]+)\s*(k)?/i);
    if (incomeMatch && incomeMatch[1]) {
        let val = parseInt(incomeMatch[1].replace(/,/g, ''), 10);
        if (incomeMatch[2] && incomeMatch[2].toLowerCase() === 'k') {
            val *= 1000;
        }
        profile.income = val;
    }
    // Occupation extraction
    if (lowerText.includes('farmer') || lowerText.includes('agriculture') || lowerText.includes('kisan')) {
        profile.occupation = 'Farmer';
    }
    else if (lowerText.includes('construction') || lowerText.includes('laborer') || lowerText.includes('mason')) {
        profile.occupation = 'Construction Worker';
    }
    else if (lowerText.includes('fisherman') || lowerText.includes('fishermen')) {
        profile.occupation = 'Fisherman';
    }
    else if (lowerText.includes('student') || lowerText.includes('college') || lowerText.includes('school')) {
        profile.occupation = 'Student';
    }
    else if (lowerText.includes('business') || lowerText.includes('entrepreneur') || lowerText.includes('shop')) {
        profile.occupation = 'Entrepreneur';
    }
    else if (lowerText.includes('safai') || lowerText.includes('sanitation')) {
        profile.occupation = 'Sanitation Worker';
    }
    // Marital Status
    if (lowerText.includes('married') || lowerText.includes('husband') || lowerText.includes('wife')) {
        profile.maritalStatus = 'Married';
    }
    else if (lowerText.includes('single') || lowerText.includes('unmarried')) {
        profile.maritalStatus = 'Single';
    }
    else if (lowerText.includes('widow') || lowerText.includes('widowed')) {
        profile.maritalStatus = 'Widowed';
    }
    else if (lowerText.includes('divorced')) {
        profile.maritalStatus = 'Divorced';
    }
    // Category
    if (lowerText.includes('obc')) {
        profile.category = 'OBC';
    }
    else if (lowerText.includes('sc') && !lowerText.includes('scheme')) {
        profile.category = 'SC';
    }
    else if (lowerText.includes('st') && !lowerText.includes('student')) {
        profile.category = 'ST';
    }
    else if (lowerText.includes('general') || lowerText.includes('open category')) {
        profile.category = 'General';
    }
    // Caste: map caste to category since they are merged
    const casteMatch = text.match(/(?:caste\s+is|caste\s*:)\s*([a-zA-Z]+)/i);
    if (casteMatch && casteMatch[1]) {
        profile.category = casteMatch[1].charAt(0).toUpperCase() + casteMatch[1].slice(1).toLowerCase();
    }
    else if (lowerText.includes('brahmin')) {
        profile.category = 'Brahmin';
    }
    // Disability Status
    const disabilityStatus = parseDisabilityStatus(text);
    if (disabilityStatus !== null) {
        profile.disabilityStatus = disabilityStatus;
    }
    return profile;
}
function parseDisabilityStatus(text) {
    const trimmedText = text.trim();
    const normalizedText = trimmedText.replace(/[\s.,!?;:]+$/g, '').replace(/^[\s.,!?;:]+/g, '');
    const lowerText = normalizedText.toLowerCase();
    if (/^(yes|true|1|y)$/i.test(normalizedText))
        return true;
    if (/^(no|false|0|n|none)$/i.test(normalizedText))
        return false;
    const negativePatterns = [
        /\bdoes(?:n['’]?t| not) have disability\b/i,
        /\bdoes(?:n['’]?t| not) have any disability\b/i,
        /\bhas no disability\b/i,
        /\bno disability\b/i,
        /\bnot disabled\b/i,
        /\bwithout disability\b/i,
        /\bnot handicapped\b/i,
        /\bno handicap\b/i,
        /\bfree of disability\b/i,
        /\bphysically? not disabled\b/i,
    ];
    if (negativePatterns.some((pattern) => pattern.test(lowerText)))
        return false;
    const positivePatterns = [
        /\bhas disability\b/i,
        /\bhas any disability\b/i,
        /\bdisabled\b/i,
        /\bhandicap(?:ped)?\b/i,
        /\bdivyang\b/i,
        /\bdifferently abled\b/i,
    ];
    if (positivePatterns.some((pattern) => pattern.test(lowerText)))
        return true;
    return null;
}
// Regex Fallback Extractor with context-aware direct answer parsing
function extractProfileRegex(text, current) {
    // 1. Run general conversational matches first
    let profile = extractGeneralRegex(text, current);
    // 2. Identify the first missing field in the current profile (what the bot just asked)
    const missing = [];
    const requiredFields = [
        'name', 'age', 'gender', 'state', 'income', 'occupation', 'maritalStatus', 'category', 'disabilityStatus'
    ];
    for (const field of requiredFields) {
        if (current[field] === null || current[field] === undefined) {
            missing.push(field);
        }
    }
    const currentMissingField = missing[0];
    const trimmedText = text.trim();
    // 3. If the field is still missing in the updated profile AND the response is short,
    // we treat it as a direct answer to the bot's question.
    if (currentMissingField && (profile[currentMissingField] === null || profile[currentMissingField] === undefined)) {
        const wordCount = trimmedText.split(/\s+/).length;
        const lowerText = trimmedText.toLowerCase();
        // We allow up to 4 words for direct answers
        if (wordCount <= 4) {
            switch (currentMissingField) {
                case 'name':
                    if (!/^(yes|no|ok|sure|fine|hello|hi|hey)$/i.test(trimmedText) && trimmedText.length >= 2) {
                        profile.name = trimmedText.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    }
                    break;
                case 'age':
                    const ageMatch = trimmedText.match(/\b\d{1,2}\b/);
                    if (ageMatch) {
                        profile.age = parseInt(ageMatch[0], 10);
                    }
                    break;
                case 'gender':
                    if (/female|woman|girl/i.test(trimmedText)) {
                        profile.gender = 'Female';
                    }
                    else if (/male|man|boy/i.test(trimmedText)) {
                        profile.gender = 'Male';
                    }
                    else if (/other/i.test(trimmedText)) {
                        profile.gender = 'Other';
                    }
                    break;
                case 'state':
                    const states = [
                        'bihar', 'rajasthan', 'uttar pradesh', 'madhya pradesh', 'karnataka', 'west bengal',
                        'chhattisgarh', 'andhra pradesh', 'puducherry', 'kerala', 'maharashtra', 'gujarat',
                        'punjab', 'haryana', 'tamil nadu', 'odisha', 'telangana', 'assam', 'jharkhand',
                        'uttarakhand', 'himachal pradesh', 'delhi', 'goa', 'manipur', 'meghalaya', 'mizoram',
                        'nagaland', 'sikkim', 'tripura', 'jammu and kashmir', 'ladakh'
                    ];
                    const matched = states.find(s => lowerText.includes(s));
                    if (matched) {
                        profile.state = matched.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    }
                    break;
                case 'income':
                    const incomeNumMatch = trimmedText.replace(/,/g, '').match(/\b(\d+)\s*(k)?\b/i);
                    if (incomeNumMatch) {
                        let val = parseInt(incomeNumMatch[1], 10);
                        if (incomeNumMatch[2] && incomeNumMatch[2].toLowerCase() === 'k') {
                            val *= 1000;
                        }
                        profile.income = val;
                    }
                    break;
                case 'occupation':
                    if (/farmer|kisan|agriculture/i.test(trimmedText)) {
                        profile.occupation = 'Farmer';
                    }
                    else if (/construction|labor|mason/i.test(trimmedText)) {
                        profile.occupation = 'Construction Worker';
                    }
                    else if (/fish/i.test(trimmedText)) {
                        profile.occupation = 'Fisherman';
                    }
                    else if (/student|college|school/i.test(trimmedText)) {
                        profile.occupation = 'Student';
                    }
                    else if (/business|shop|entrepreneur/i.test(trimmedText)) {
                        profile.occupation = 'Entrepreneur';
                    }
                    else if (/safai|sanitation/i.test(trimmedText)) {
                        profile.occupation = 'Sanitation Worker';
                    }
                    else if (trimmedText.length >= 3 && !/^(yes|no|none|ok)$/i.test(trimmedText)) {
                        profile.occupation = trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1).toLowerCase();
                    }
                    break;
                case 'maritalStatus':
                    if (/married/i.test(trimmedText)) {
                        profile.maritalStatus = 'Married';
                    }
                    else if (/single|unmarried/i.test(trimmedText)) {
                        profile.maritalStatus = 'Single';
                    }
                    else if (/widow/i.test(trimmedText)) {
                        profile.maritalStatus = 'Widowed';
                    }
                    else if (/divorce/i.test(trimmedText)) {
                        profile.maritalStatus = 'Divorced';
                    }
                    break;
                case 'category':
                    if (/general|open/i.test(trimmedText)) {
                        profile.category = 'General';
                    }
                    else if (/obc/i.test(trimmedText)) {
                        profile.category = 'OBC';
                    }
                    else if (/sc/i.test(trimmedText)) {
                        profile.category = 'SC';
                    }
                    else if (/st/i.test(trimmedText)) {
                        profile.category = 'ST';
                    }
                    else if (trimmedText.length >= 2 && !/^(yes|no|none|ok)$/i.test(trimmedText)) {
                        profile.category = trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1).toLowerCase();
                    }
                    break;
                case 'disabilityStatus':
                    const disabilityAnswer = parseDisabilityStatus(trimmedText);
                    if (disabilityAnswer !== null) {
                        profile.disabilityStatus = disabilityAnswer;
                    }
                    break;
            }
        }
    }
    return profile;
}
async function extractProfile(text, currentProfile) {
    if (!env_1.config.GROQ_API_KEY) {
        console.log('[ProfileExtractor] GROQ_API_KEY not set. Using regex fallback extraction.');
        return extractProfileRegex(text, currentProfile);
    }
    try {
        const groq = new groq_sdk_1.default({ apiKey: env_1.config.GROQ_API_KEY });
        const systemPrompt = `
You are an expert NLU system for a government welfare platform.
Your task is to extract citizen profile information from natural language dialogue.
Maintain a JSON profile with these fields:
- name (string or null)
- age (integer or null)
- gender ("Male" | "Female" | "Other" | null)
- state (string or null, normalize to standard Indian states like "Bihar", "Rajasthan", "Uttar Pradesh", "West Bengal", etc.)
- income (integer or null, annual family income in Rupees)
- occupation (string or null, e.g., "Farmer", "Construction Worker", "Fisherman", "Student", "Sanitation Worker", "Entrepreneur", etc.)
- maritalStatus ("Single" | "Married" | "Widowed" | "Divorced" | null)
- category ("General" | "OBC" | "SC" | "ST" or a specific caste like "Brahmin", "Yadav", etc. if mentioned)
- disabilityStatus (boolean or null)

You will be given:
1. The current profile state (JSON).
2. The new citizen statement.

Merge the new information into the current profile. If fields are not mentioned, do not modify them. Do not invent any values. 
Return ONLY the updated JSON profile object. No explanations, no markdown formatting (except JSON).
`;
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Current Profile: ${JSON.stringify(currentProfile)}\nNew Statement: "${text}"`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });
        const content = response.choices[0]?.message?.content;
        if (content) {
            const parsed = JSON.parse(content);
            // Sanitizing age
            let age = currentProfile.age;
            if (parsed.age !== undefined && parsed.age !== null) {
                if (typeof parsed.age === 'number') {
                    age = parsed.age;
                }
                else if (typeof parsed.age === 'string') {
                    const parsedInt = parseInt(parsed.age, 10);
                    if (!isNaN(parsedInt))
                        age = parsedInt;
                }
            }
            // Sanitizing income
            let income = currentProfile.income;
            if (parsed.income !== undefined && parsed.income !== null) {
                if (typeof parsed.income === 'number') {
                    income = parsed.income;
                }
                else if (typeof parsed.income === 'string') {
                    const cleanStr = parsed.income.replace(/,/g, '');
                    const parsedInt = parseInt(cleanStr, 10);
                    if (!isNaN(parsedInt))
                        income = parsedInt;
                }
            }
            // Sanitizing disability status
            let disabilityStatus = currentProfile.disabilityStatus;
            if (parsed.disabilityStatus !== undefined && parsed.disabilityStatus !== null) {
                if (typeof parsed.disabilityStatus === 'boolean') {
                    disabilityStatus = parsed.disabilityStatus;
                }
                else if (typeof parsed.disabilityStatus === 'string') {
                    const normalizedDisability = parseDisabilityStatus(parsed.disabilityStatus);
                    if (normalizedDisability !== null) {
                        disabilityStatus = normalizedDisability;
                    }
                }
            }
            // Sanitizing gender
            let gender = currentProfile.gender;
            if (parsed.gender) {
                const genStr = String(parsed.gender).charAt(0).toUpperCase() + String(parsed.gender).slice(1).toLowerCase();
                if (['Male', 'Female', 'Other'].includes(genStr)) {
                    gender = genStr;
                }
            }
            // Sanitizing marital status
            let maritalStatus = currentProfile.maritalStatus;
            if (parsed.maritalStatus) {
                const marStr = String(parsed.maritalStatus).charAt(0).toUpperCase() + String(parsed.maritalStatus).slice(1).toLowerCase();
                if (['Single', 'Married', 'Widowed', 'Divorced'].includes(marStr)) {
                    maritalStatus = marStr;
                }
            }
            return {
                name: parsed.name !== undefined ? parsed.name : currentProfile.name,
                age,
                gender,
                state: parsed.state !== undefined ? parsed.state : currentProfile.state,
                income,
                occupation: parsed.occupation !== undefined ? parsed.occupation : currentProfile.occupation,
                maritalStatus,
                category: ['General', 'OBC', 'SC', 'ST'].includes(parsed.category) || (parsed.category && parsed.category.length >= 2) ? parsed.category : currentProfile.category,
                disabilityStatus
            };
        }
    }
    catch (err) {
        console.error('[ProfileExtractor] Error with Groq API. Falling back to regex extraction:', err);
    }
    return extractProfileRegex(text, currentProfile);
}
