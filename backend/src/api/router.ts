/**
 * router.ts
 * All API endpoints. Language is extracted from every request body and
 * threaded through the entire call chain so the LLM responds in the
 * correct language at every step.
 *
 * Language flow:
 *   POST body { language: 'hi' }
 *   → session.language updated
 *   → detectMissingFields(profile, language)   → Hindi questions
 *   → generateRecommendationsReport(..., language) → Hindi report
 *   → generateApplicationSummary(..., language)    → Hindi summary
 *   → buildRecommendationPrompt prepends LANGUAGE_INSTRUCTION[language]
 *   → Groq responds in Hindi
 */
import { Router, Request, Response } from 'express';
import {
  createSession, getSession, saveSession, resetSession, ChatMessage,
} from '../forms/sessionManager';
import { extractProfile } from '../profile/profileExtractor';
import { mergeProfile } from '../profile/profileBuilder';
import { detectMissingFields } from '../profile/missingFieldDetector';
import { getRecommendations } from '../recommendation/recommendationEngine';
import { generateRecommendationsReport } from '../rag/generator';
import { startApplication, getCurrentQuestion, submitAnswerAndProgress } from '../forms/questionFlow';
import { generateApplicationSummary } from '../forms/applicationBuilder';
import { getAllSchemes } from '../services/dbService';
import {
  SupportedLanguage,
  PROFILE_COMPLETE_MESSAGE,
  PROFILE_ERROR_MESSAGE,
  APPLICATION_COMPLETE_MESSAGE,
} from '../i18n/backendStrings';
import { v4 as uuidv4 } from 'uuid';

export const apiRouter = Router();

/** Safely parse language from request — default to 'en' if invalid */
function parseLanguage(lang: unknown): SupportedLanguage {
  return lang === 'hi' ? 'hi' : 'en';
}

// ─── Create session ───────────────────────────────────────────────────────────
apiRouter.post('/session', (req: Request, res: Response) => {
  const language = parseLanguage(req.body?.language);
  const session = createSession(language);
  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    recommendationReport: session.recommendationReport,
  });
});

// ─── Reset session ────────────────────────────────────────────────────────────
apiRouter.post('/reset', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const language = parseLanguage(req.body?.language);
  const session = resetSession(sessionId, language);
  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    recommendationReport: session.recommendationReport,
  });
});

// ─── Get session ──────────────────────────────────────────────────────────────
apiRouter.get('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  return res.json(session);
});

// ─── Chat ─────────────────────────────────────────────────────────────────────
apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { sessionId, message } = req.body;
  const language = parseLanguage(req.body?.language);

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  let session = getSession(sessionId);
  if (!session) {
    session = createSession(language);
    session.sessionId = sessionId;
    saveSession(session);
  }

  // Update session language in case user switched mid-session
  session.language = language;

  // 1. Add user message
  const userMsg: ChatMessage = {
    id: uuidv4(),
    role: 'user',
    content: message,
    timestamp: Date.now(),
  };
  session.messages.push(userMsg);

  // 2. Extract profile from statement
  console.log(`[API] Extracting profile from: "${message}" (lang: ${language})`);
  const extracted = await extractProfile(message, session.profile);
  session.profile = mergeProfile(session.profile, extracted);

  // 3. Detect missing fields — using selected language for questions
  const { missingFields, nextQuestion } = detectMissingFields(session.profile, language);

  let responseMessage = '';
  let recommendations: any[] = [];
  let report: string | null = null;

  if (missingFields.length > 0) {
    responseMessage = nextQuestion || 'Could you please provide more details about the citizen?';
  } else {
    console.log('[API] Profile complete! Triggering recommendation engine...');
    try {
      const { recommendations: recs, rawScored } = await getRecommendations(session.profile, message);
      recommendations = recs;
      // Generate RAG report in the selected language
      report = await generateRecommendationsReport(session.profile, rawScored, language);
      session.recommendationReport = report;
      responseMessage = PROFILE_COMPLETE_MESSAGE[language];
    } catch (err) {
      console.error('[API] Failed to generate recommendations:', err);
      responseMessage = PROFILE_ERROR_MESSAGE[language];
    }
  }

  // 4. Add assistant response
  const assistantMsg: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: responseMessage,
    timestamp: Date.now(),
  };
  session.messages.push(assistantMsg);
  saveSession(session);

  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    missingFields,
    recommendations,
    report,
  });
});

// ─── Select scheme ────────────────────────────────────────────────────────────
apiRouter.post('/select-scheme', (req: Request, res: Response) => {
  const { sessionId, schemeId, schemeName } = req.body;
  if (!sessionId || !schemeId || !schemeName) {
    return res.status(400).json({ error: 'sessionId, schemeId, and schemeName are required' });
  }

  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Update language if provided
  const language = parseLanguage(req.body?.language);
  session.language = language;

  startApplication(session, schemeId, schemeName);
  const nextQuestion = getCurrentQuestion(session);

  return res.json({
    sessionId: session.sessionId,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    nextQuestion,
    applicationAnswers: session.applicationAnswers,
  });
});

// ─── Submit answer ────────────────────────────────────────────────────────────
apiRouter.post('/submit-answer', async (req: Request, res: Response) => {
  const { sessionId, answer } = req.body;
  if (!sessionId || answer === undefined) {
    return res.status(400).json({ error: 'sessionId and answer are required' });
  }

  const session = getSession(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.activeMode !== 'apply') {
    return res.status(400).json({ error: 'Session is not in application mode' });
  }

  // Update language if provided
  const language = parseLanguage(req.body?.language);
  session.language = language;

  const currentQuestion = getCurrentQuestion(session);
  if (!currentQuestion) {
    return res.status(400).json({ error: 'No active question found' });
  }

  // Log user answer in message history
  session.messages.push({
    id: uuidv4(),
    role: 'user',
    content: `${currentQuestion.label}: ${answer}`,
    timestamp: Date.now(),
  });

  const { nextQuestion } = submitAnswerAndProgress(session, answer);

  let summaryReport: string | null = null;

  if (nextQuestion) {
    session.messages.push({
      id: uuidv4(),
      role: 'assistant',
      content: `Question: ${nextQuestion.label}`,
      timestamp: Date.now(),
    });
  } else {
    // Form complete — generate summary in the selected language
    console.log('[API] Form complete! Generating summary report...');
    const schemes = getAllSchemes();
    const scheme = schemes.find((s) => s.schemeId === session!.selectedSchemeId) || {
      schemeId: session!.selectedSchemeId!,
      schemeName: session!.selectedSchemeName!,
      slug: session!.selectedSchemeId!,
      level: 'State',
      category: [],
      tags: [],
      states: [],
      gender: 'All' as any,
      incomeLimit: null,
      minAge: null,
      maxAge: null,
      categories: [],
      occupations: [],
      disabilityOnly: false,
      details: '',
      benefits: '',
      eligibility: '',
      application: '',
      documents: '',
      searchText: '',
    };

    summaryReport = await generateApplicationSummary(session, scheme, language);
    const completionMsg = APPLICATION_COMPLETE_MESSAGE[language](session.selectedSchemeName || '');

    session.messages.push({
      id: uuidv4(),
      role: 'assistant',
      content: completionMsg,
      timestamp: Date.now(),
    });
  }

  saveSession(session);

  return res.json({
    sessionId: session.sessionId,
    activeMode: session.activeMode,
    nextQuestion,
    applicationAnswers: session.applicationAnswers,
    messages: session.messages,
    summaryReport,
  });
});
