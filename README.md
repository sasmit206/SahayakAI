# Sahayak AI — AI-Powered Welfare Scheme Recommendation & Decision Platform

Sahayak AI is a flagship caseworker assistant platform designed for NGO workers in India. It enables them to sit with a citizen, collect their profile through natural conversation, deterministically evaluate eligibility for over 3,400+ welfare schemes, generate structured recommendation briefings, and lead them through a finite state machine (FSM) application collection workflow.

This is a production-grade portfolio application demonstrating high-quality software engineering, hybrid retrieval RAG, and strict separation of deterministic business logic and LLM capabilities.

---

## 🏛️ Architectural Overview

```
                        +----------------------------------+
                        |         Caseworker UI            |
                        | (React + TypeScript + Tailwind)  |
                        +----------------------------------+
                                         │
                                         ▼
                        +----------------------------------+
                        |          Express API             |
                        |      (Node.js + TypeScript)      |
                        +----------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     +-----------------------+                       +-----------------------+
     |   Deterministic Logic |                       |       LLM Logic       |
     |                       |                       |      (Groq API)       |
     | - Metadata Filtering  |                       |                       |
     | - BM25 Retrieval      |                       | - NLU Profile Extract |
     | - Eligibility Rules   |                       | - Case RAG Reports    |
     | - Application FSM     |                       | - Briefing Summaries  |
     +-----------------------+                       +-----------------------+
                 │                                               
                 ▼                                               
     +-----------------------+                                   
     |    Hybrid Retrieval   |                                   
     | (ChromaDB + Local RRF)|                                   
     +-----------------------+                                   
                 │                                               
                 ▼                                               
     +-----------------------+                                   
     |  Sequence Classifier  |                                   
     | (bge-reranker-base)   |                                   
     +-----------------------+                                   
```

### 1. Separation of Concerns
*   **Deterministic Engine:** The LLM does *not* decide eligibility, calculate match scores, or invent benefit requirements. All rules matching (State, Income, Age, Gender, Category, Occupation, Disability) are executed using a rule-based Express engine.
*   **LLM Engine:** Groq API is utilized strictly for parsing natural conversation into structured fields, translating matching logs into casework briefings, and compiling final application summaries.

### 2. Retrieval Pipeline
*   **Stage 1 (Metadata Filter):** Reduces search space using hard constraints (State, Gender, Category).
*   **Stage 2 (Hybrid Retrieval):** Fuses keyword search (Custom BM25) and vector search (ChromaDB + local `bge-large-en-v1.5` embeddings) using Reciprocal Rank Fusion (RRF).
*   **Stage 3 (Re-ranking):** Applies local ONNX sequence classification (`bge-reranker-base`) on the top 30 candidates to output the final top 5 recommendations.

---

## 🚀 Setup & Execution Guide

### Prerequisites
*   **Node.js** v18+ (tested on v22)
*   **Python** 3.10+ (for ChromaDB server)

---

### Step 1: Clone and Install Dependencies
From the root project directory:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

---

### Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```bash
# backend/.env
PORT=5001
GROQ_API_KEY=your_groq_api_key_here
CHROMA_URL=http://localhost:8000
EMBEDDING_MODEL=Xenova/bge-large-en-v1.5
RERANKER_MODEL=Xenova/bge-reranker-base
```
> **Note:** If `GROQ_API_KEY` is not provided, the backend automatically falls back to local regex-based NLU extraction and local template formatting, ensuring the system runs fully functional offline/keyless.

---

### Step 3: Start ChromaDB Server
ChromaDB is run locally inside a Python virtual environment to keep global dependencies clean:
```bash
# Setup virtual environment and start Chroma DB
python3 -m venv venv
source venv/bin/activate
pip install chromadb
chroma run --host localhost --port 8000 --path ./chroma_db
```

---

### Step 4: Run Scheme Ingestion
Populate the vector database from the provided welfare database:
```bash
# Run ingestion (defaults to first 150 schemes for quick local load)
npm run ingest

# Or ingest the full dataset (takes a few minutes depending on CPU)
INGEST_LIMIT=-1 npm run ingest
```

---

### Step 5: Start Servers
Start the backend and frontend simultaneously:
```bash
# From the project root
npm run dev
```
*   **Caseworker Dashboard:** `http://localhost:3000`
*   **Express API Server:** `http://localhost:5001`

---

## 🧪 Testing & Evaluation Strategy

We have implemented an automated evaluation framework to measure search recall, recommendation validity, and response latencies.

Run the evaluation suite:
```bash
# Run automated benchmarks
npm run evaluate
```

### Measured Targets
*   **Recall@5:** Target > 90%
*   **Recall@10:** Target > 95%
*   **MRR (Mean Reciprocal Rank):** Target > 0.80
*   **Eligibility Accuracy:** Target 100% (Verifies no recommended scheme violates profile limits)
*   **Response Latency:** Target < 2.0s
