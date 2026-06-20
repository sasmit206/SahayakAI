import { CitizenProfile } from './profileExtractor';

export interface ValidationError {
  field: keyof CitizenProfile;
  message: string;
}

export function validateProfile(profile: CitizenProfile): ValidationError[] {
  const errors: ValidationError[] = [];

  if (profile.age !== null) {
    if (profile.age < 0 || profile.age > 120 || !Number.isInteger(profile.age)) {
      errors.push({ field: 'age', message: 'Age must be a valid integer between 0 and 120.' });
    }
  }

  if (profile.income !== null) {
    if (profile.income < 0) {
      errors.push({ field: 'income', message: 'Income must be a positive number.' });
    }
  }

  if (profile.gender !== null) {
    if (!['Male', 'Female', 'Other'].includes(profile.gender)) {
      errors.push({ field: 'gender', message: 'Gender must be Male, Female, or Other.' });
    }
  }

  if (profile.maritalStatus !== null) {
    if (!['Single', 'Married', 'Widowed', 'Divorced'].includes(profile.maritalStatus)) {
      errors.push({ field: 'maritalStatus', message: 'Marital status must be Single, Married, Widowed, or Divorced.' });
    }
  }

  if (profile.category !== null) {
    if (!['General', 'OBC', 'SC', 'ST'].includes(profile.category)) {
      errors.push({ field: 'category', message: 'Category must be General, OBC, SC, or ST.' });
    }
  }

  return errors;
}
