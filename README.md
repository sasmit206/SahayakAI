# Sahayak AI - AI-Powered Welfare Scheme Recommendation & Decision Platform

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

## 🧭 Quick-Reply Fields (No More Loops)

Gender, marital status, social category, disability status, and state are **determinate fields** — a fixed, known set of valid answers. These are no longer collected via free text in chat. Instead the bot renders buttons (gender/marital/category/disability) or a dropdown (state, 37 options) directly under its question, and the selection is sent to the backend as a structured `{ field, value }` pair that bypasses all NLU/regex matching entirely. This is what makes them immune to the "bot keeps asking the same question" loop — there is no keyword the answer needs to match, because there's no free text to parse.

Name, age, income, and occupation remain free text, since they're open-ended by nature.

---

## 🗣️ Voice & Hindi Typing

*   **Speech-to-text & text-to-speech:** Browser-native **Web Speech API** (`SpeechRecognition` + `SpeechSynthesis`) — free forever, zero npm dependency, zero API key. Click the mic to speak; toggle the speaker icon to have replies read aloud automatically, or hover any bot message and tap its play button to hear that one message on demand. Recognition/synthesis language follows the active EN/हिंदी toggle.
*   **Hindi transliteration while typing:** In हिंदी mode, type phonetically in Latin letters (e.g. `mera naam ram hai`) and a live Devanagari suggestion appears above the input — press **Tab** or tap it to accept, or ignore it and send the Latin text as-is. Built on `@indic-transliteration/sanscript`, runs entirely client-side. Numbers are left untouched so age/income parsing keeps working.
*   **On-screen virtual Hindi keyboard:** Tap the keyboard icon next to the input (हिंदी mode only) for a clickable Devanagari keyboard — vowels, consonants, matras, and digits. Works alongside transliteration; use whichever is faster for a given word. If the device already has a native Hindi keyboard/IME, that input passes through untouched.
*   **Bilingual chat replies:** Bot questions, the recommendation report, and the application summary all render in the active language. **With `GROQ_API_KEY` set**, the LLM genuinely understands and replies in Hindi/Hinglish for the free-text fields (name, occupation, etc.) and the Groq-generated reports. Without a key, the regex-fallback extraction is English-pattern based for free text — though the quick-reply fields above are unaffected either way, since they never go through regex at all.

---

## 🚀 Setup & Execution Guide

### Prerequisites
*   **Node.js** v18+ (tested on v22)
*   **Python** 3.10+ (for ChromaDB server)
*   **Chrome, Edge, or Safari** recommended for voice features (mic input / spoken replies) — these use the browser's built-in Web Speech API, which Firefox keeps disabled by default. Everything else (quick-reply buttons, transliteration, virtual keyboard) works in any modern browser.
*   This update adds `@indic-transliteration/sanscript` as a new frontend dependency (already in `package-lock.json`). If you use `bun`, run `bun install` once to refresh `bun.lock` — it wasn't regenerated as part of this change.

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
