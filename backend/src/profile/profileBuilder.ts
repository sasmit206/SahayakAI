import { CitizenProfile, INITIAL_PROFILE } from './profileExtractor';

export function createInitialProfile(): CitizenProfile {
  return { ...INITIAL_PROFILE };
}

export function mergeProfile(current: CitizenProfile, updates: Partial<CitizenProfile>): CitizenProfile {
  const merged = { ...current };
  
  for (const key in updates) {
    const field = key as keyof CitizenProfile;
    if (updates[field] !== undefined && updates[field] !== null) {
      // TypeScript type asserting for assignment
      (merged as any)[field] = updates[field];
    }
  }
  
  return merged;
}
