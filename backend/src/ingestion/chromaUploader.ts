import { ChromaClient } from 'chromadb';
import { config } from '../config/env';
import { SchemeDocument } from './normalizer';
import { generateEmbeddingsBatch } from './embeddingGenerator';

export async function uploadToChroma(schemes: SchemeDocument[]) {
  const client = new ChromaClient({ path: config.CHROMA_URL });
  
  console.log(`Connecting to ChromaDB at ${config.CHROMA_URL}...`);
  
  const collectionName = 'sahayak_schemes';
  
  // Clean start: try deleting collection first
  try {
    await client.deleteCollection({ name: collectionName });
    console.log(`Deleted existing collection: ${collectionName}`);
  } catch (err) {
    // Ignore error if it doesn't exist
  }
  
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { "hnsw:space": "cosine" }
  });
  
  console.log(`Created collection: ${collectionName}. Starting upload of ${schemes.length} schemes...`);
  
  // We upload in batches of 100
  const batchSize = 50; // smaller batches to be safe and report progress
  for (let i = 0; i < schemes.length; i += batchSize) {
    const batch = schemes.slice(i, i + batchSize);
    
    const ids = batch.map(s => s.schemeId);
    const documents = batch.map(s => s.searchText);
    
    // Chroma metadata requires flat types (string, number, boolean)
    const metadatas = batch.map(s => ({
      schemeId: s.schemeId,
      schemeName: s.schemeName,
      slug: s.slug,
      level: s.level,
      category: s.category.join(','),
      tags: s.tags.join(','),
      states: s.states.join(','),
      gender: s.gender,
      incomeLimit: s.incomeLimit !== null ? s.incomeLimit : -1,
      minAge: s.minAge !== null ? s.minAge : -1,
      maxAge: s.maxAge !== null ? s.maxAge : -1,
      categories: s.categories.join(','),
      occupations: s.occupations.join(','),
      disabilityOnly: s.disabilityOnly ? 1 : 0
    }));
    
    console.log(`Generating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(schemes.length / batchSize)}...`);
    const embeddings = await generateEmbeddingsBatch(documents, 16);
    
    console.log(`Uploading batch ${Math.floor(i / batchSize) + 1} to ChromaDB...`);
    await collection.add({
      ids,
      embeddings,
      metadatas,
      documents
    });
  }
  
  console.log('ChromaDB upload completed successfully!');
}

/**
 * Incrementally adds schemes to the EXISTING collection without deleting it.
 * Used when ingesting newly-uploaded PDFs so we don't wipe out the schemes
 * already loaded from the CSV.
 */
export async function addSchemesToChroma(schemes: SchemeDocument[]) {
  if (schemes.length === 0) return;

  const client = new ChromaClient({ path: config.CHROMA_URL });
  const collectionName = 'sahayak_schemes';

  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { "hnsw:space": "cosine" }
  });

  const ids = schemes.map(s => s.schemeId);
  const documents = schemes.map(s => s.searchText);
  const metadatas = schemes.map(s => ({
    schemeId: s.schemeId,
    schemeName: s.schemeName,
    slug: s.slug,
    level: s.level,
    category: s.category.join(','),
    tags: s.tags.join(','),
    states: s.states.join(','),
    gender: s.gender,
    incomeLimit: s.incomeLimit !== null ? s.incomeLimit : -1,
    minAge: s.minAge !== null ? s.minAge : -1,
    maxAge: s.maxAge !== null ? s.maxAge : -1,
    categories: s.categories.join(','),
    occupations: s.occupations.join(','),
    disabilityOnly: s.disabilityOnly ? 1 : 0
  }));

  console.log(`Generating embeddings for ${schemes.length} new PDF-sourced scheme(s)...`);
  const embeddings = await generateEmbeddingsBatch(documents, 16);

  console.log(`Upserting ${schemes.length} scheme(s) into existing ChromaDB collection...`);
  await collection.upsert({
    ids,
    embeddings,
    metadatas,
    documents
  });

  console.log('Incremental ChromaDB upload completed successfully!');
}

export default uploadToChroma;
