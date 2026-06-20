import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env, and fallback to workspace root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  PORT: process.env.PORT || '5001',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'Xenova/bge-large-en-v1.5',
  RERANKER_MODEL: process.env.RERANKER_MODEL || 'Xenova/bge-reranker-base',
  CSV_PATH: path.resolve(__dirname, '../../../updated_data.csv'),
  CHROMA_DB_PATH: path.resolve(__dirname, '../../../chroma_db'),
};
