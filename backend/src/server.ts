import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { apiRouter } from './api/router';
import { initializeDbService } from './services/dbService';

const app = express();
const PORT = config.PORT || '5001';

// Configure middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api', apiRouter);

// Root healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start service
async function startServer() {
  console.log('--- Starting Sahayak AI Backend Server ---');
  
  // 1. Initialize In-memory Database & BM25 Retriever
  await initializeDbService();
  
  // 2. Start Express Listener
  // Start service and load config env
  app.listen(PORT, () => {
    console.log(`Backend Express server listening at http://localhost:${PORT}`);
    console.log(`ChromaDB server is expected at ${config.CHROMA_URL}`);
    console.log('Press Ctrl+C to terminate.');
  });
}

startServer().catch(err => {
  console.error('Server startup failed with error:', err);
  process.exit(1);
});
