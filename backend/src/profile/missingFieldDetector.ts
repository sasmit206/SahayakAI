import { CitizenProfile } from './profileExtractor';

export type FieldInputType = 'text' | 'number' | 'select' | 'buttons';

export interface NextFieldInfo {
  key: keyof CitizenProfile;
  inputType: FieldInputType;
  options?: string[]; // canonical values, in the language-neutral form stored on the profile
}

export interface MissingFieldsInfo {
  missingFields: (keyof CitizenProfile)[];
  nextField: NextFieldInfo | null;
}

// User-friendly field display names (used for logging/ProfilePanel fallback only —
// the actual question text shown to the citizen is rendered from i18n by language)
export const FIELD_LABELS: Record<keyof CitizenProfile, string> = {
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
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Daman and Diu',
  'Dadra and Nagar Haveli', 'Lakshadweep', 'Andaman and Nicobar'
];

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
export const MARITAL_OPTIONS = ['Single', 'Married', 'Widowed', 'Divorced'];
export const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST'];
export const YES_NO_OPTIONS = ['Yes', 'No'];

const FIELD_INPUT: Record<keyof CitizenProfile, { inputType: FieldInputType; options?: string[] }> = {
  name: { inputType: 'text' },
  age: { inputType: 'number' },
  gender: { inputType: 'buttons', options: GENDER_OPTIONS },
  state: { inputType: 'select', options: INDIAN_STATES },
  income: { inputType: 'number' },
  occupation: { inputType: 'text' },
  maritalStatus: { inputType: 'buttons', options: MARITAL_OPTIONS },
  category: { inputType: 'buttons', options: CATEGORY_OPTIONS },
  disabilityStatus: { inputType: 'buttons', options: YES_NO_OPTIONS },
};

export function detectMissingFields(profile: CitizenProfile): MissingFieldsInfo {
  const missingFields: (keyof CitizenProfile)[] = [];

  const requiredFields: (keyof CitizenProfile)[] = [
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
