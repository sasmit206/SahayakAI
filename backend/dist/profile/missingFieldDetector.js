"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIELD_LABELS = void 0;
exports.detectMissingFields = detectMissingFields;
// User-friendly field display names
exports.FIELD_LABELS = {
    name: 'Name',
    age: 'Age',
    gender: 'Gender',
    state: 'State',
    income: 'Annual Income',
    occupation: 'Occupation',
    maritalStatus: 'Marital Status',
    category: 'Category (General/OBC/SC/ST)',
    disabilityStatus: 'Disability Status',
};
function detectMissingFields(profile) {
    const missingFields = [];
    const requiredFields = [
        'name',
        'age',
        'gender',
        'state',
        'income',
        'occupation',
        'maritalStatus',
        'category',
        'disabilityStatus'
    ];
    for (const field of requiredFields) {
        if (profile[field] === null || profile[field] === undefined) {
            missingFields.push(field);
        }
    }
    if (missingFields.length === 0) {
        return { missingFields: [], nextQuestion: null };
    }
    // Generate question for the first missing field
    const nextField = missingFields[0];
    let nextQuestion = '';
    switch (nextField) {
        case 'name':
            nextQuestion = "Could you please tell me the citizen's name?";
            break;
        case 'age':
            nextQuestion = "What is the applicant's age?";
            break;
        case 'gender':
            nextQuestion = "What is the applicant's gender? (Male/Female/Other)";
            break;
        case 'state':
            nextQuestion = "Which state is the applicant from?";
            break;
        case 'income':
            nextQuestion = "What is the applicant's annual family income (in ₹)?";
            break;
        case 'occupation':
            nextQuestion = "What is the applicant's occupation? (e.g., Farmer, Student, Construction Worker, etc.)";
            break;
        case 'maritalStatus':
            nextQuestion = "What is the applicant's marital status? (Single/Married/Widowed/Divorced)";
            break;
        case 'category':
            nextQuestion = "Which social category does the applicant belong to? (General, OBC, SC, ST)";
            break;
        case 'disabilityStatus':
            nextQuestion = "Does the applicant have any physical disability? (Yes/No)";
            break;
        default:
            nextQuestion = `Please provide information for: ${exports.FIELD_LABELS[nextField]}.`;
    }
    return { missingFields, nextQuestion };
}
