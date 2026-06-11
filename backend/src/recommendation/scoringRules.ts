export const SCORING_WEIGHTS = {
  STATE_MATCH: 30,
  OCCUPATION_MATCH: 25,
  INCOME_MATCH: 20,
  AGE_MATCH: 15,
  CATEGORY_MATCH: 10,
  GENDER_MATCH: 10,
};

export interface EligibilityResult {
  isEligible: boolean;
  score: number;
  reasons: string[];
}
