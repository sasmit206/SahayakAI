import { SchemeDocument } from '../ingestion/normalizer';
import { EligibilityResult } from './scoringRules';
import { Lang } from '../i18n/botStrings';
import { translateScheme } from '../i18n/schemeTranslator';

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
  maxScore: number;
  matchPercentage: number;
  isEligible: boolean;
  reasons: string[];
}


export async function formatRecommendation(
  scheme: SchemeDocument,
  eligibility: EligibilityResult,
  lang: Lang = 'en'
): Promise<RecommendationResponse> {
  if (lang === 'hi' || lang === 'kn') {
    const translated = await translateScheme(scheme, lang);
    return {
      schemeId: scheme.schemeId,
      schemeName: translated.schemeName,
      slug: scheme.slug,
      level: scheme.level,
      category: translated.category,
      tags: translated.tags,
      benefits: translated.benefits,
      eligibilityText: translated.eligibilityText,
      documents: translated.documents,
      application: translated.application,
      score: eligibility.score,
      maxScore: eligibility.maxScore,
      matchPercentage: eligibility.matchPercentage,
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
    maxScore: eligibility.maxScore,
    matchPercentage: eligibility.matchPercentage,
    isEligible: eligibility.isEligible,
    reasons: eligibility.reasons,
  };
}
export default formatRecommendation;
