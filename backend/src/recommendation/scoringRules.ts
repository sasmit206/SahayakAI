export const SCORING_WEIGHTS = {
  STATE_MATCH: 30,
  OCCUPATION_MATCH: 25,
  INCOME_MATCH: 20,
  AGE_MATCH: 15,
  CATEGORY_MATCH: 10,
  GENDER_MATCH: 10,
  DISABILITY_MATCH: 15,
};

export interface EligibilityResult {
  isEligible: boolean;
  score: number;
  // Highest score this specific scheme could ever produce (varies only by
  // whether the scheme is disability-restricted). Used to turn the raw
  // additive `score` into a citizen-facing match percentage.
  maxScore: number;
  // Round(score / maxScore * 100), 0 for ineligible schemes. Always present
  // so the frontend never has to compute this itself.
  matchPercentage: number;
  reasons: string[];
}

// Every eligibility branch below always awards its weight on *some* path
// (either an explicit match, or the "open to all" / "no restriction" path),
// so the achievable maximum for an eligible scheme is fixed and only grows
// by the disability weight when the scheme is disability-only.
export function computeMaxScore(disabilityOnly: boolean): number {
  const base =
    SCORING_WEIGHTS.STATE_MATCH +
    SCORING_WEIGHTS.GENDER_MATCH +
    SCORING_WEIGHTS.INCOME_MATCH +
    SCORING_WEIGHTS.AGE_MATCH +
    SCORING_WEIGHTS.OCCUPATION_MATCH +
    SCORING_WEIGHTS.CATEGORY_MATCH;
  return disabilityOnly ? base + SCORING_WEIGHTS.DISABILITY_MATCH : base;
}
