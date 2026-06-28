"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FORM_CONFIG = exports.SCHEME_FORM_CONFIGS = void 0;
exports.getFormConfigForScheme = getFormConfigForScheme;
exports.SCHEME_FORM_CONFIGS = {
    // Garuda Scheme for Funeral Expense
    'gsfe': {
        schemeId: 'gsfe',
        schemeName: 'Garuda Scheme for Funeral Expense',
        fields: [
            { key: 'deceasedName', label: 'Name of the Deceased Brahmin', type: 'text', placeholder: 'Enter deceased person name' },
            { key: 'relationship', label: 'Relationship with the Deceased', type: 'choice', choices: ['Spouse', 'Son', 'Daughter', 'Parent', 'Brother', 'Grandson'], placeholder: 'Select relationship' },
            { key: 'aadhaarDeceased', label: 'Aadhaar Card of the Deceased', type: 'text', placeholder: '12-digit Aadhaar number of deceased' },
            { key: 'bankAccount', label: 'Bank Account Number of Applicant', type: 'text', placeholder: 'SB Account number in Andhra Bank or SBI' },
            { key: 'bankIfsc', label: 'Bank IFSC Code', type: 'text', placeholder: 'IFSC Code' },
            { key: 'deathCertificateNo', label: 'Death Certificate Registration Number', type: 'text', placeholder: 'Registration Number on Death Certificate' }
        ]
    },
    // Example for PM Kisan (or similar farmer schemes in data)
    'pm-kisan': {
        schemeId: 'pm-kisan',
        schemeName: 'Pradhan Mantri Kisan Samman Nidhi (PM-Kisan)',
        fields: [
            { key: 'fullName', label: 'Full Name (as in Aadhaar)', type: 'text', placeholder: 'Enter full name' },
            { key: 'aadhaarNumber', label: '12-Digit Aadhaar Number', type: 'text', placeholder: '0000-0000-0000' },
            { key: 'bankAccount', label: 'Bank Account Number', type: 'text', placeholder: 'Enter account number' },
            { key: 'ifscCode', label: 'Bank IFSC Code', type: 'text', placeholder: 'e.g., SBIN0001234' },
            { key: 'landOwnership', label: 'Land Ownership Status', type: 'choice', choices: ['Yes (Owner)', 'No (Tenant)', 'Marginal Farmer'], placeholder: 'Select land ownership status' }
        ]
    },
    // Burial and Ex-gratia Payment Scheme in Case of Death of Unregistered Laborer
    'baepsicodouldwact': {
        schemeId: 'baepsicodouldwact',
        schemeName: 'Burial and Ex-gratia Payment Scheme',
        fields: [
            { key: 'laborerName', label: 'Name of the Deceased Laborer', type: 'text', placeholder: 'Deceased worker name' },
            { key: 'constructionSite', label: 'Construction Site Address', type: 'text', placeholder: 'Where the accident occurred' },
            { key: 'nomineeName', label: 'Nominee / Legal Heir Name', type: 'text', placeholder: 'Full name of the applicant' },
            { key: 'aadhaarNominee', label: 'Aadhaar Card of Nominee', type: 'text', placeholder: '12-digit Aadhaar' },
            { key: 'bankAccount', label: 'Bank Account Details of Nominee', type: 'text', placeholder: 'Account number' },
            { key: 'ifscCode', label: 'IFSC Code', type: 'text', placeholder: 'IFSC' }
        ]
    }
};
const DEFAULT_FORM_CONFIG = (schemeId, schemeName) => ({
    schemeId,
    schemeName,
    fields: [
        { key: 'applicantName', label: 'Applicant Full Name', type: 'text', placeholder: 'Enter full name as on Aadhaar' },
        { key: 'aadhaarNumber', label: '12-Digit Aadhaar Number', type: 'text', placeholder: '0000-0000-0000' },
        { key: 'phoneNumber', label: 'Mobile Number', type: 'text', placeholder: '10-digit mobile number' },
        { key: 'bankAccount', label: 'Bank Account Number', type: 'text', placeholder: 'Enter bank account number' },
        { key: 'ifscCode', label: 'Bank IFSC Code', type: 'text', placeholder: 'IFSC Code' },
        { key: 'agreeTerms', label: 'I verify that the information is correct and matches original documents', type: 'boolean' }
    ]
});
exports.DEFAULT_FORM_CONFIG = DEFAULT_FORM_CONFIG;
function getFormConfigForScheme(schemeId, schemeName) {
    // Try matching by key
    if (exports.SCHEME_FORM_CONFIGS[schemeId]) {
        return exports.SCHEME_FORM_CONFIGS[schemeId];
    }
    // Or check if slug contains words in config keys
    for (const key of Object.keys(exports.SCHEME_FORM_CONFIGS)) {
        if (schemeId.includes(key) || key.includes(schemeId)) {
            return exports.SCHEME_FORM_CONFIGS[key];
        }
    }
    // Fallback to default
    return (0, exports.DEFAULT_FORM_CONFIG)(schemeId, schemeName);
}
