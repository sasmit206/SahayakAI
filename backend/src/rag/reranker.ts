import { config } from '../config/env';
import { SchemeDocument } from '../ingestion/normalizer';

let rerankerPromise: any = null;

async function getReranker() {
  if (config.RERANKER_MODEL === 'none' || !config.RERANKER_MODEL) {
    throw new Error('Reranking model is disabled (configured as "none")');
  }
  if (!rerankerPromise) {
    console.log(`[Reranker] Loading reranking model: ${config.RERANKER_MODEL}`);
    try {
      const { pipeline } = await eval('import("@xenova/transformers")');
      rerankerPromise = pipeline('text-classification', config.RERANKER_MODEL);
    } catch (err) {
      console.warn('Failed to dynamically import @xenova/transformers, trying require:', err);
      try {
        const { pipeline } = require('@xenova/transformers');
        rerankerPromise = pipeline('text-classification', config.RERANKER_MODEL);
      } catch (requireErr) {
        throw new Error(`Could not load @xenova/transformers for reranking: ${requireErr}`);
      }
    }
  }
  return rerankerPromise;
}

export interface RerankedScheme {
  doc: SchemeDocument;
  // Semantic relevance of this scheme to the citizen's profile/query,
  // normalized to [0, 1] via a sigmoid (the raw cross-encoder output isn't
  // guaranteed to already be a bounded probability, so we squash it rather
  // than assume). Higher = more relevant. `null` when the reranker model
  // couldn't be loaded/run at all, so callers can tell "no signal" apart
  // from "genuinely low relevance" instead of silently treating both as 0.
  relevance: number | null;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Re-ranks candidate schemes by semantic relevance to `query` and returns
 * the top `topK`, each tagged with its normalized relevance score. This is
 * the ONLY place in the pipeline that captures how well a specific scheme's
 * content actually matches what the citizen said/needs (as opposed to the
 * eligibility engine, which only knows binary criteria like state/income/age
 * gates) — so this score is what lets the citizen-facing match percentage
 * differ scheme-to-scheme instead of being 100% for every eligible result.
 */
export async function rerankCandidates(
  query: string,
  candidates: SchemeDocument[],
  topK = 5
): Promise<RerankedScheme[]> {
  if (candidates.length === 0) return [];

  try {
    const reranker = await getReranker();

    const scoredCandidates = await Promise.all(
      candidates.map(async (doc) => {
        try {
          // Truncate document text to avoid exceeding token limit (512 tokens)
          const docText = doc.searchText.slice(0, 1000);

          // Call classification pipeline with pair
          const output = await reranker(query, { text_pair: docText });

          // bge-reranker models typically output a logit or score under
          // label 'LABEL_0'/'LABEL_1'. We squash it into a stable [0,1]
          // relevance value regardless of whether the raw output was
          // already a probability or a raw logit.
          const rawScore = output[0]?.score !== undefined ? output[0].score : 0;
          const relevance = rawScore >= 0 && rawScore <= 1 ? rawScore : sigmoid(rawScore);
          return { doc, relevance };
        } catch (innerErr) {
          console.warn(`[Reranker] Failed to score document: ${doc.schemeName}`, innerErr);
          return { doc, relevance: 0 };
        }
      })
    );

    // Sort descending by relevance
    scoredCandidates.sort((a, b) => b.relevance - a.relevance);
    return scoredCandidates.slice(0, topK);
  } catch (err) {
    console.error('[Reranker] Failed to run local reranking. Falling back to input order.', err);
    // Fallback: return the first topK of candidates in the order they were
    // retrieved, with relevance = null so callers know no real semantic
    // signal was available (rather than faking a flat score).
    return candidates.slice(0, topK).map(doc => ({ doc, relevance: null }));
  }
}
export default rerankCandidates;
