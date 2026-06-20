import { v4 as uuidv4 } from 'uuid';
import { CitizenProfile, INITIAL_PROFILE } from '../profile/profileExtractor';
import { SchemeFormConfig } from './schemeFormConfigs';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface CaseworkSession {
  sessionId: string;
  profile: CitizenProfile;
  messages: ChatMessage[];
  activeMode: 'chat' | 'apply' | 'completed';
  selectedSchemeId: string | null;
  selectedSchemeName: string | null;
  applicationAnswers: Record<string, any>;
  currentFormQuestionIndex: number;
  formConfig: SchemeFormConfig | null;
  recommendationReport: string | null;
  createdAt: number;
}

const SESSIONS_STORE = new Map<string, CaseworkSession>();

export function createSession(): CaseworkSession {
  const sessionId = uuidv4();
  const session: CaseworkSession = {
    sessionId,
    profile: { ...INITIAL_PROFILE },
    messages: [
      {
        id: uuidv4(),
        role: 'assistant',
        content: "Hello! I am Sahayak AI, your caseworker assistant. Let's start by understanding the citizen's profile. You can speak naturally, or write a statement like: 'I am Ram, a farmer from Bihar, married and earning ₹90,000 per year.'",
        timestamp: Date.now()
      }
    ],
    activeMode: 'chat',
    selectedSchemeId: null,
    selectedSchemeName: null,
    applicationAnswers: {},
    currentFormQuestionIndex: -1,
    formConfig: null,
    recommendationReport: null,
    createdAt: Date.now()
  };
  
  SESSIONS_STORE.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): CaseworkSession | undefined {
  return SESSIONS_STORE.get(sessionId);
}

export function saveSession(session: CaseworkSession): void {
  SESSIONS_STORE.set(session.sessionId, session);
}

export function resetSession(sessionId: string): CaseworkSession {
  const oldSession = SESSIONS_STORE.get(sessionId);
  const newSession = createSession();
  if (oldSession) {
    newSession.sessionId = oldSession.sessionId;
  }
  SESSIONS_STORE.set(newSession.sessionId, newSession);
  return newSession;
}
