import { CitizenProfile } from '../profile/profileExtractor';
import { getAllSchemes } from '../services/dbService';
import { evaluateEligibility } from './eligibilityEngine';
import { retrieveHybrid } from '../rag/hybridRetriever';
import { rerankCandidates } from '../rag/reranker';
import { formatRecommendation, RecommendationResponse } from './recommendationFormatter';
import { ScoredScheme } from '../rag/promptBuilder';
import { Lang } from '../i18n/botStrings';

export async function getRecommendations(
  profile: CitizenProfile,
  userQuery?: string,
  limit = 5,
  lang: Lang = 'en'
): Promise<{ recommendations: RecommendationResponse[]; rawScored: ScoredScheme[] }> {
  // 1. ELIGIBILITY ENGINE: Filter all schemes in memory to get candidate schemes
  const allSchemes = getAllSchemes();
  const candidatesWithScores = allSchemes
    .map(scheme => {
      const eligibility = evaluateEligibility(profile, scheme, lang);
      return { scheme, eligibility };
    })
    // Filter out strictly ineligible schemes
    .filter(item => item.eligibility.isEligible);

  if (candidatesWithScores.length === 0) {
    return { recommendations: [], rawScored: [] };
  }

  // Create a map of eligible candidate IDs for fast lookup
  const eligibleIds = new Set(candidatesWithScores.map(c => c.scheme.schemeId));

  // 2. HYBRID RETRIEVAL
  // Construct search query from profile if no query is provided
  const searchTerms = [
    profile.occupation,
    profile.state,
    profile.category,
    userQuery
  ].filter(t => typeof t === 'string' && t.length > 0);
  
  const query = searchTerms.join(' ');
  console.log(`[RecommendationEngine] Formulated Hybrid Search Query: "${query}"`);

  // Retrieve top candidates
  const hybridResults = await retrieveHybrid(query, 50);

  // Filter hybrid results to only include eligible candidates
  const eligibleHybridResults = hybridResults
    .filter(res => eligibleIds.has(res.doc.schemeId))
    .map(res => res.doc);

  // If we don't have enough results from hybrid search, pad with top eligible candidate schemes by score
  if (eligibleHybridResults.length < 30) {
    // Sort candidates by eligibility score descending
    const sortedCandidates = [...candidatesWithScores]
      .sort((a, b) => b.eligibility.score - a.eligibility.score)
      .map(c => c.scheme);

    for (const sc of sortedCandidates) {
      if (eligibleHybridResults.length >= 30) break;
      if (!eligibleHybridResults.some(r => r.schemeId === sc.schemeId)) {
        eligibleHybridResults.push(sc);
      }
    }
  }

  // Slice to top 30 for re-ranking
  const top30Candidates = eligibleHybridResults.slice(0, 30);

  // 3. RE-RANKING (Top 30 -> Top 5)
  console.log(`[RecommendationEngine] Reranking ${top30Candidates.length} eligible candidates...`);
  const top5Schemes = await rerankCandidates(query, top30Candidates, limit);

  // 4. FORMAT OUTPUT
  const recommendations: RecommendationResponse[] = [];
  const rawScored: ScoredScheme[] = [];

  for (const scheme of top5Schemes) {
    const cand = candidatesWithScores.find(c => c.scheme.schemeId === scheme.schemeId);
    if (cand) {
      recommendations.push(await formatRecommendation(scheme, cand.eligibility, lang));
      rawScored.push({ scheme, eligibility: cand.eligibility });
    }
  }


  return { recommendations, rawScored };
}
export default getRecommendations;
