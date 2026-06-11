import { ChromaClient } from 'chromadb';
import { config } from '../config/env';
import { generateEmbedding } from '../ingestion/embeddingGenerator';
import { SchemeDocument } from '../ingestion/normalizer';

export function parseSearchText(text: string, baseDoc: SchemeDocument): SchemeDocument {
  const doc = { ...baseDoc };
  
  const extractField = (marker: string, nextMarkerReg: RegExp): string => {
    const startIdx = text.indexOf(marker);
    if (startIdx === -1) return '';
    const startContentIdx = startIdx + marker.length;
    
    const remainingText = text.substring(startContentIdx);
    const match = remainingText.match(nextMarkerReg);
    
    if (match && match.index !== undefined) {
      return remainingText.substring(0, match.index).trim();
    }
    return remainingText.trim();
  };

  const nextReg = /\n(Scheme Name|Category|Tags|Level|Details|Benefits|Eligibility Criteria|Application Process|Documents Required):/i;

  doc.details = extractField('Details: ', nextReg);
  doc.benefits = extractField('Benefits: ', nextReg);
  doc.eligibility = extractField('Eligibility Criteria: ', nextReg);
  doc.application = extractField('Application Process: ', nextReg);
  doc.documents = extractField('Documents Required: ', nextReg);

  return doc;
}

export async function queryVectorDB(
  query: string,
  limit = 30
): Promise<{ doc: SchemeDocument; score: number }[]> {
  const client = new ChromaClient({ path: config.CHROMA_URL });
  const collectionName = 'sahayak_schemes';
  
  try {
    const collection = await client.getCollection({ 
      name: collectionName,
      embeddingFunction: null as any
    });
    
    const queryEmbedding = await generateEmbedding(query);
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit
    });
    
    if (!results || !results.ids || results.ids[0].length === 0) {
      return [];
    }
    
    const output: { doc: SchemeDocument; score: number }[] = [];
    const ids = results.ids[0];
    const metadatas = results.metadatas[0];
    const documents = results.documents[0];
    const distances = results.distances ? results.distances[0] : [];
    
    for (let i = 0; i < ids.length; i++) {
      const meta = metadatas[i] as any;
      if (!meta) continue;
      
      const doc: SchemeDocument = {
        schemeId: meta.schemeId,
        schemeName: meta.schemeName,
        slug: meta.slug,
        level: meta.level,
        category: meta.category ? meta.category.split(',') : [],
        tags: meta.tags ? meta.tags.split(',') : [],
        states: meta.states ? meta.states.split(',') : [],
        gender: meta.gender,
        incomeLimit: meta.incomeLimit !== -1 ? meta.incomeLimit : null,
        minAge: meta.minAge !== -1 ? meta.minAge : null,
        maxAge: meta.maxAge !== -1 ? meta.maxAge : null,
        categories: meta.categories ? meta.categories.split(',') : [],
        occupations: meta.occupations ? meta.occupations.split(',') : [],
        disabilityOnly: meta.disabilityOnly === 1,
        details: '',
        benefits: '',
        eligibility: '',
        application: '',
        documents: '',
        searchText: documents[i] || '',
      };
      
      const reconstructedDoc = parseSearchText(documents[i] || '', doc);
      
      // Chroma distance is L2 or Cosine distance. If it is cosine distance, cosine similarity = 1 - distance
      // If it is L2, distance ranges from 0 to infinity. Let's normalize score to a reasonable 0-1 range.
      const dist = distances.length > i ? distances[i] : 0.5;
      const score = 1 / (1 + dist); // robust normalization for any distance metric
      
      output.push({ doc: reconstructedDoc, score });
    }
    
    return output;
  } catch (err) {
    console.error('Error querying ChromaDB:', err);
    return [];
  }
}
