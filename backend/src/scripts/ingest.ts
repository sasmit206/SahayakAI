import { config } from '../config/env';
import { loadSchemes } from '../ingestion/csvLoader';
import { uploadToChroma } from '../ingestion/chromaUploader';

async function runIngestion() {
  console.log('--- Starting Sahayak AI Scheme Ingestion ---');
  console.log(`CSV Path: ${config.CSV_PATH}`);
  
  try {
    const allSchemes = await loadSchemes(config.CSV_PATH);
    console.log(`Successfully parsed ${allSchemes.length} schemes from CSV.`);
    
    // Support limiting the ingestion size for faster developer iteration
    // We can define a limit via env or process arguments. Let's default to 150 schemes for speed, 
    // but allow full ingestion if specified.
    const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
    let limit = 150; // default to 150 for super fast setup
    
    if (limitArg) {
      limit = parseInt(limitArg.split('=')[1], 10);
    } else if (process.env.INGEST_LIMIT) {
      limit = parseInt(process.env.INGEST_LIMIT, 10);
    }
    
    let schemesToIngest = allSchemes;
    if (limit > 0 && limit < allSchemes.length) {
      console.log(`Limiting ingestion to the first ${limit} schemes for quick setup (use --limit=-1 or INGEST_LIMIT=-1 for all).`);
      schemesToIngest = allSchemes.slice(0, limit);
    } else {
      console.log('Ingesting ALL schemes (this might take several minutes depending on CPU/GPU hardware)...');
    }
    
    console.log(`Ingesting ${schemesToIngest.length} schemes into ChromaDB collection...`);
    const start = Date.now();
    
    await uploadToChroma(schemesToIngest);
    
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Ingestion completed in ${duration} seconds.`);
    console.log('--- Ingestion Process Finished Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Ingestion failed with error:', error);
    process.exit(1);
  }
}

runIngestion();
