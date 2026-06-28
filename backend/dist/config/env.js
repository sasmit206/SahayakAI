"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from backend/.env, and fallback to workspace root .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../../.env') });
exports.config = {
    PORT: process.env.PORT || '5001',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8000',
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'Xenova/bge-large-en-v1.5',
    RERANKER_MODEL: process.env.RERANKER_MODEL || 'Xenova/bge-reranker-base',
    CSV_PATH: path_1.default.resolve(__dirname, '../../../updated_data.csv'),
    CHROMA_DB_PATH: path_1.default.resolve(__dirname, '../../../chroma_db'),
};
