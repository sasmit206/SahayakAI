import { SchemeDocument } from '../ingestion/normalizer';
import { EligibilityResult } from './scoringRules';
import { Lang } from '../i18n/botStrings';
import { translateSchemeToHindi } from '../i18n/schemeTranslator';

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


export async function formatRecommendation(
  scheme: SchemeDocument,
  eligibility: EligibilityResult,
  lang: Lang = 'en'
): Promise<RecommendationResponse> {
  if (lang === 'hi') {
    const hi = await translateSchemeToHindi(scheme);
    return {
      schemeId: scheme.schemeId,
      schemeName: hi.schemeName,
      slug: scheme.slug,
      level: scheme.level,
      category: hi.category,
      tags: hi.tags,
      benefits: hi.benefits,
      eligibilityText: hi.eligibilityText,
      documents: hi.documents,
      application: hi.application,
      score: eligibility.score,
      isEligible: eligibility.isEligible,
      reasons: eligibility.reasons,
    };
  }

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
