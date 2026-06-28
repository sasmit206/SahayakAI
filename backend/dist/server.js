"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const router_1 = require("./api/router");
const adminRouter_1 = require("./api/adminRouter");
const dbService_1 = require("./services/dbService");
const app = (0, express_1.default)();
const PORT = env_1.config.PORT || '5001';
// Configure middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Register routes
app.use('/api', router_1.apiRouter);
app.use('/api/admin', adminRouter_1.adminRouter);
// Root healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Start service
async function startServer() {
    console.log('--- Starting Sahayak AI Backend Server ---');
    // 1. Initialize In-memory Database & BM25 Retriever
    await (0, dbService_1.initializeDbService)();
    // 2. Start Express Listener
    // Start service and load config env
    app.listen(PORT, () => {
        console.log(`Backend Express server listening at http://localhost:${PORT}`);
        console.log(`ChromaDB server is expected at ${env_1.config.CHROMA_URL}`);
        console.log('Press Ctrl+C to terminate.');
    });
}
startServer().catch(err => {
    console.error('Server startup failed with error:', err);
    process.exit(1);
});
