/**
 * api.ts
 * All HTTP calls to the backend. Every request now includes `language`
 * so the backend LLM responds in the correct language.
 */
import axios from 'axios';

const client = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

export interface CitizenProfile {
  name: string | null;
  age: number | null;
  gender: 'Male' | 'Female' | 'Other' | null;
  state: string | null;
  income: number | null;
  occupation: string | null;
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced' | null;
  category: string | null;
  disabilityStatus: boolean | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SchemeRecommendation {
  schemeId: string;
  schemeName: string;
  slug: string;
  level: string;
  category: string[];
  tags: string[];
  benefits: string;
  eligibilityText: string;
  documents: string;
  application: string;
  score: number;
  isEligible: boolean;
  reasons: string[];
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'choice';
  choices?: string[];
  placeholder?: string;
}

export interface SessionResponse {
  sessionId: string;
  profile: CitizenProfile;
  messages: ChatMessage[];
  activeMode: 'chat' | 'apply' | 'completed';
  selectedSchemeId: string | null;
  selectedSchemeName: string | null;
  recommendationReport: string | null;
}

export interface ChatResponse {
  sessionId: string;
  profile: CitizenProfile;
  messages: ChatMessage[];
  activeMode: 'chat' | 'apply' | 'completed';
  missingFields: string[];
  recommendations: SchemeRecommendation[];
  report: string | null;
}

export interface SelectionResponse {
  sessionId: string;
  activeMode: 'chat' | 'apply' | 'completed';
  selectedSchemeId: string;
  selectedSchemeName: string;
  nextQuestion: FormField | null;
  applicationAnswers: Record<string, any>;
}

export interface AnswerResponse {
  sessionId: string;
  activeMode: 'chat' | 'apply' | 'completed';
  nextQuestion: FormField | null;
  applicationAnswers: Record<string, any>;
  messages: ChatMessage[];
  summaryReport: string | null;
}

export const sahayakApi = {
  createSession: async (language = 'en'): Promise<SessionResponse> => {
    const res = await client.post('/api/session', { language });
    return res.data;
  },

  resetSession: async (sessionId: string, language = 'en'): Promise<ChatResponse> => {
    const res = await client.post('/api/reset', { sessionId, language });
    return res.data;
  },

  /** language is sent with every message so the LLM always replies correctly */
  sendMessage: async (sessionId: string, message: string, language = 'en'): Promise<ChatResponse> => {
    const res = await client.post('/api/chat', { sessionId, message, language });
    return res.data;
  },

  selectScheme: async (
    sessionId: string,
    schemeId: string,
    schemeName: string,
    language = 'en'
  ): Promise<SelectionResponse> => {
    const res = await client.post('/api/select-scheme', { sessionId, schemeId, schemeName, language });
    return res.data;
  },

  submitAnswer: async (sessionId: string, answer: any, language = 'en'): Promise<AnswerResponse> => {
    const res = await client.post('/api/submit-answer', { sessionId, answer, language });
    return res.data;
  },
};

export default sahayakApi;
