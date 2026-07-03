import { CitizenProfile } from '../profile/profileExtractor';
import { getAllSchemes } from '../services/dbService';
import { evaluateEligibility } from './eligibilityEngine';
import { retrieveHybrid } from '../rag/hybridRetriever';
import { rerankCandidates } from '../rag/reranker';
import { formatRecommendation, RecommendationResponse } from './recommendationFormatter';
import { ScoredScheme } from '../rag/promptBuilder';
import { Lang } from '../i18n/botStrings';

// How much of the citizen-facing match percentage comes from hard
// eligibility (state/gender/income/age/occupation/category/disability
// gates) vs. semantic relevance of the scheme's actual content to what the
// citizen said/needs.
//
// Every scheme that reaches this function has ALREADY passed every
// eligibility gate (ineligible schemes are filtered out entirely earlier),
// so the eligibility component alone is always 100% for every candidate —
// it would make the displayed percentage identical (and uninformative) for
// every card. Blending in the reranker's semantic relevance score is what
// lets the percentage actually differ scheme-to-scheme, reflecting how well
// each specific scheme's benefits/description match the citizen's profile
// and stated situation, on top of the fact that they qualify for all of them.
const ELIGIBILITY_WEIGHT = 0.7;
const RELEVANCE_WEIGHT = 0.3;

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

  // 3. RE-RANKING (Top 30 -> Top 5), now carrying each scheme's semantic
  // relevance score (0-1) alongside it instead of discarding it.
  console.log(`[RecommendationEngine] Reranking ${top30Candidates.length} eligible candidates...`);
  const rerankedTop5 = await rerankCandidates(query, top30Candidates, limit);

  // 4. FORMAT OUTPUT
  const recommendations: RecommendationResponse[] = [];
  const rawScored: ScoredScheme[] = [];

  for (const { doc: scheme, relevance } of rerankedTop5) {
    const cand = candidatesWithScores.find(c => c.scheme.schemeId === scheme.schemeId);
    if (!cand) continue;

    const formatted = await formatRecommendation(scheme, cand.eligibility, lang);

    // Blend eligibility fit with semantic relevance so the displayed
    // percentage actually varies between schemes. If the reranker couldn't
    // run (relevance === null), fall back to pure eligibility completeness
    // rather than fabricating a relevance number.
    const eligibilityFraction = cand.eligibility.maxScore > 0
      ? cand.eligibility.score / cand.eligibility.maxScore
      : 0;
    formatted.matchPercentage = relevance === null
      ? Math.round(eligibilityFraction * 100)
      : Math.round(eligibilityFraction * ELIGIBILITY_WEIGHT * 100 + relevance * RELEVANCE_WEIGHT * 100);

    recommendations.push(formatted);
    rawScored.push({ scheme, eligibility: cand.eligibility });
  }

  // Present the strongest matches first — citizens should always see them
  // ordered by the blended percentage they're shown, not just whatever
  // order the retrieval/rerank steps happened to settle on.
  const order = recommendations
    .map((rec, idx) => ({ idx, pct: rec.matchPercentage }))
    .sort((a, b) => b.pct - a.pct)
    .map(o => o.idx);
  const sortedRecommendations = order.map(i => recommendations[i]);
  const sortedRawScored = order.map(i => rawScored[i]);

  return { recommendations: sortedRecommendations, rawScored: sortedRawScored };
}
export default getRecommendations;
