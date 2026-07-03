import { v4 as uuidv4 } from 'uuid';
import { CitizenProfile, INITIAL_PROFILE } from '../profile/profileExtractor';
import { SchemeFormConfig } from './schemeFormConfigs';
import { Lang, botString } from '../i18n/botStrings';

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
  language: Lang;
  createdAt: number;
}

const SESSIONS_STORE = new Map<string, CaseworkSession>();

export function createSession(language: Lang = 'en'): CaseworkSession {
  const sessionId = uuidv4();
  const session: CaseworkSession = {
    sessionId,
    profile: { ...INITIAL_PROFILE },
    messages: [
      {
        id: uuidv4(),
        role: 'assistant',
        content: botString('welcome', language),
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
    language,
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

export function resetSession(sessionId: string, language?: Lang): CaseworkSession {
  const oldSession = SESSIONS_STORE.get(sessionId);
  const newSession = createSession(language ?? oldSession?.language ?? 'en');
  if (oldSession) {
    newSession.sessionId = oldSession.sessionId;
  }
  SESSIONS_STORE.set(newSession.sessionId, newSession);
  return newSession;
}
