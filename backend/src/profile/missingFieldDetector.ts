/**
 * missingFieldDetector.ts
 * Detects which profile fields are still null and returns the next
 * question to ask. Questions are now multilingual via backendStrings.
 */
import { CitizenProfile } from './profileExtractor';
import { SupportedLanguage, MISSING_FIELD_QUESTIONS } from '../i18n/backendStrings';

export interface MissingFieldsInfo {
  missingFields: (keyof CitizenProfile)[];
  nextQuestion: string | null;
}

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

export function detectMissingFields(
  profile: CitizenProfile,
  language: SupportedLanguage = 'en'
): MissingFieldsInfo {
  const requiredFields: (keyof CitizenProfile)[] = [
    'name', 'age', 'gender', 'state', 'income',
    'occupation', 'maritalStatus', 'category', 'disabilityStatus',
  ];

  const missingFields = requiredFields.filter(
    (field) => profile[field] === null || profile[field] === undefined
  );

  if (missingFields.length === 0) {
    return { missingFields: [], nextQuestion: null };
  }

  const nextField = missingFields[0];
  const questions = MISSING_FIELD_QUESTIONS[language];
  const nextQuestion = questions[nextField as string] ?? questions['default'];

  return { missingFields, nextQuestion };
}
