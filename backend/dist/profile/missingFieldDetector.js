"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YES_NO_OPTIONS = exports.CATEGORY_OPTIONS = exports.MARITAL_OPTIONS = exports.GENDER_OPTIONS = exports.INDIAN_STATES = exports.FIELD_LABELS = void 0;
exports.detectMissingFields = detectMissingFields;
// User-friendly field display names (used for logging/ProfilePanel fallback only —
// the actual question text shown to the citizen is rendered from i18n by language)
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
// Canonical option values. These are the exact strings stored on CitizenProfile —
// the same casing the eligibility engine and the rest of the backend expect.
// Frontend renders translated labels but always sends one of these back.
exports.INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Daman and Diu',
    'Dadra and Nagar Haveli', 'Lakshadweep', 'Andaman and Nicobar'
];
exports.GENDER_OPTIONS = ['Male', 'Female', 'Other'];
exports.MARITAL_OPTIONS = ['Single', 'Married', 'Widowed', 'Divorced'];
exports.CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST'];
exports.YES_NO_OPTIONS = ['Yes', 'No'];
const FIELD_INPUT = {
    name: { inputType: 'text' },
    age: { inputType: 'number' },
    gender: { inputType: 'buttons', options: exports.GENDER_OPTIONS },
    state: { inputType: 'select', options: exports.INDIAN_STATES },
    income: { inputType: 'number' },
    occupation: { inputType: 'text' },
    maritalStatus: { inputType: 'buttons', options: exports.MARITAL_OPTIONS },
    category: { inputType: 'buttons', options: exports.CATEGORY_OPTIONS },
    disabilityStatus: { inputType: 'buttons', options: exports.YES_NO_OPTIONS },
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
        return { missingFields: [], nextField: null };
    }
    const key = missingFields[0];
    const { inputType, options } = FIELD_INPUT[key];
    return { missingFields, nextField: { key, inputType, options } };
}
