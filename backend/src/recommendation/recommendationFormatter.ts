import { SchemeDocument } from '../ingestion/normalizer';
import { EligibilityResult } from './scoringRules';

export interface RecommendationResponse {
  schemeId: string;
  schemeName: string;
  slug: string;
  level: string;
  category: string[];
  tags: string[];
  benefits: string;
  eligibilityText: string;
  documents: string;
  application: string;
  score: number;
  isEligible: boolean;
  reasons: string[];
}

export function formatRecommendation(
  scheme: SchemeDocument,
  eligibility: EligibilityResult
): RecommendationResponse {
  return {
    schemeId: scheme.schemeId,
    schemeName: scheme.schemeName,
    slug: scheme.slug,
    level: scheme.level,
    category: scheme.category,
    tags: scheme.tags,
    benefits: scheme.benefits,
    eligibilityText: scheme.eligibility,
    documents: scheme.documents,
    application: scheme.application,
    score: eligibility.score,
    isEligible: eligibility.isEligible,
    reasons: eligibility.reasons,
  };
}
export default formatRecommendation;
