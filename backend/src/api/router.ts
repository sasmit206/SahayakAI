import { Router, Request, Response } from 'express';
import { createSession, getSession, saveSession, resetSession, ChatMessage } from '../forms/sessionManager';
import { extractProfile, applyDirectFieldValue, CitizenProfile } from '../profile/profileExtractor';
import { mergeProfile } from '../profile/profileBuilder';
import { detectMissingFields } from '../profile/missingFieldDetector';
import { getRecommendations } from '../recommendation/recommendationEngine';
import { generateRecommendationsReport } from '../rag/generator';
import { startApplication, getCurrentQuestion, submitAnswerAndProgress } from '../forms/questionFlow';
import { generateApplicationSummary } from '../forms/applicationBuilder';
import { getAllSchemes } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { normalizeLang, questionFor, botString, optionLabels, Lang } from '../i18n/botStrings';

export const apiRouter = Router();

function normalizeDisabilityAnswer(message: string): boolean | null {
  const normalized = message.trim().replace(/[\s.,!?;:]+$/g, '').replace(/^[\s.,!?;:]+/g, '');
  const lower = normalized.toLowerCase();

  if (/^(yes|true|1|y|हाँ|हां|ಹೌದು)$/i.test(normalized)) return true;
  if (/^(no|false|0|n|none|नहीं|ಇಲ್ಲ)$/i.test(normalized)) return false;

  if (
    /\bdoes(?:n['’]?t| not) have disability\b/i.test(lower) ||
    /\bdoes(?:n['’]?t| not) have any disability\b/i.test(lower) ||
    /\bhas no disability\b/i.test(lower) ||
    /\bnot disabled\b/i.test(lower) ||
    /\bwithout disability\b/i.test(lower) ||
    /\bnot handicapped\b/i.test(lower) ||
    /\bno handicap\b/i.test(lower)
  ) {
    return false;
  }

  if (
    /\bhas disability\b/i.test(lower) ||
    /\bhas any disability\b/i.test(lower) ||
    /\bdisabled\b/i.test(lower) ||
    /\bhandicap(?:ped)?\b/i.test(lower) ||
    /\bdivyang\b/i.test(lower) ||
    /\bdifferently abled\b/i.test(lower)
  ) {
    return true;
  }

  return null;
}

// Builds the nextField payload sent to the frontend, with translated option
// labels alongside the canonical (untranslated) values the profile stores.
function buildNextFieldPayload(nextField: ReturnType<typeof detectMissingFields>['nextField'], lang: Lang) {
  if (!nextField) return null;
  return {
    key: nextField.key,
    inputType: nextField.inputType,
    options: nextField.options ? optionLabels(nextField.options, lang) : undefined,
  };
}

// Create new session
apiRouter.post('/session', (req: Request, res: Response) => {
  const language = normalizeLang(req.body?.language);
  const session = createSession(language);
  const { nextField } = detectMissingFields(session.profile);
  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    recommendationReport: session.recommendationReport,
    nextField: buildNextFieldPayload(nextField, language)
  });
});

// Reset session
apiRouter.post('/reset', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  const language = req.body?.language ? normalizeLang(req.body.language) : undefined;
  const session = resetSession(sessionId, language);
  const { nextField } = detectMissingFields(session.profile);
  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    recommendationReport: session.recommendationReport,
    nextField: buildNextFieldPayload(nextField, session.language)
  });
});

// Get session details
apiRouter.get('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json(session);
});

// Chat endpoint ( natural language conversation and profile extraction )
// Accepts either free-text `message`, or a structured quick-reply
// `{ quickReply: { field, value } }` for buttons/dropdown selections —
// the latter bypasses all NLU/regex and can never fail to match.
apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { sessionId, message, quickReply } = req.body;

  if (!sessionId || (!message && !quickReply)) {
    return res.status(400).json({ error: 'sessionId and message (or quickReply) are required' });
  }

  let session = getSession(sessionId);
  if (!session) {
    // Fallback: create session if not found
    session = createSession(req.body?.language ? normalizeLang(req.body.language) : 'en');
    session.sessionId = sessionId;
    saveSession(session);
  }

  // Allow the citizen to switch language mid-conversation via the UI toggle
  if (req.body?.language) {
    session.language = normalizeLang(req.body.language);
  }
  const lang = session.language || 'en';

  if (quickReply && quickReply.field && quickReply.value !== undefined) {
    // Structured selection from a button/dropdown — deterministic, no NLU involved.
    const fieldKey = quickReply.field as keyof CitizenProfile;
    const displayValue = String(quickReply.value);

    session.messages.push({
      id: uuidv4(),
      role: 'user',
      content: displayValue,
      timestamp: Date.now()
    });

    session.profile = applyDirectFieldValue(fieldKey, quickReply.canonicalValue ?? quickReply.value, session.profile);
  } else {
    // 1. Add free-text user message to session
    session.messages.push({
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // 2. Extract profile fields via NLU/regex
    console.log(`[API] Extracting profile fields from user statement: "${message}"`);
    const extracted = await extractProfile(message, session.profile);
    session.profile = mergeProfile(session.profile, extracted);

    // Defense-in-depth: if someone typed a yes/no answer instead of tapping the
    // disability button, still catch it rather than looping.
    if (session.profile.disabilityStatus === null) {
      const disabilityAnswer = normalizeDisabilityAnswer(message);
      if (disabilityAnswer !== null) {
        session.profile.disabilityStatus = disabilityAnswer;
      }
    }
  }

  // 3. Detect missing fields
  const { missingFields, nextField } = detectMissingFields(session.profile);

  let responseMessage = '';
  let recommendations: any[] = [];
  let report: string | null = null;

  if (missingFields.length > 0) {
    // Still missing fields, ask for the next one
    responseMessage = nextField ? questionFor(nextField.key, lang) : botString('askMore', lang);
  } else {
    // Profile is complete! Trigger recommendation pipeline
    console.log('[API] Profile is complete! Triggering recommendation engine...');
    try {
      const { recommendations: recs, rawScored } = await getRecommendations(session.profile, message || '', 5, lang);
      recommendations = recs;

      // Generate RAG report using Groq
      report = await generateRecommendationsReport(session.profile, rawScored, lang);
      session.recommendationReport = report;
      responseMessage = botString('recsReady', lang);
    } catch (err) {
      console.error('[API] Failed to generate recommendations:', err);
      responseMessage = botString('recsError', lang);
    }
  }

  // 4. Add assistant response to session
  session.messages.push({
    id: uuidv4(),
    role: 'assistant',
    content: responseMessage,
    timestamp: Date.now()
  });

  saveSession(session);

  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    missingFields,
    nextField: buildNextFieldPayload(nextField, lang),
    recommendations,
    report
  });
});

// Select scheme to start application FSM
apiRouter.post('/select-scheme', (req: Request, res: Response) => {
  const { sessionId, schemeId, schemeName } = req.body;
  if (!sessionId || !schemeId || !schemeName) {
    return res.status(400).json({ error: 'sessionId, schemeId, and schemeName are required' });
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Start application FSM
  startApplication(session, schemeId, schemeName);
  const nextQuestion = getCurrentQuestion(session);

  return res.json({
    sessionId: session.sessionId,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    nextQuestion,
    applicationAnswers: session.applicationAnswers
  });
});

// Submit answer in application FSM
apiRouter.post('/submit-answer', async (req: Request, res: Response) => {
  const { sessionId, answer } = req.body;
  if (!sessionId || answer === undefined) {
    return res.status(400).json({ error: 'sessionId and answer are required' });
  }

  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.activeMode !== 'apply') {
    return res.status(400).json({ error: 'Session is not in application mode' });
  }

  // Get current question details for message history
  const currentQuestion = getCurrentQuestion(session);
  if (!currentQuestion) {
    return res.status(400).json({ error: 'No active question found' });
  }

  // Add user answer to message history
  session.messages.push({
    id: uuidv4(),
    role: 'user',
    content: `${currentQuestion.label}: ${answer}`,
    timestamp: Date.now()
  });

  // Progress the FSM
  const { nextQuestion } = submitAnswerAndProgress(session, answer);

  let summaryReport: string | null = null;
  let responseText = '';

  if (nextQuestion) {
    // Ask the next question
    responseText = `Question: ${nextQuestion.label}`;
    session.messages.push({
      id: uuidv4(),
      role: 'assistant',
      content: responseText,
      timestamp: Date.now()
    });
  } else {
    // Form is completed! Generate final summary
    console.log('[API] Form complete! Compiling final summary report...');
    const schemes = getAllSchemes();
    const scheme = schemes.find(s => s.schemeId === session!.selectedSchemeId) || {
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
      searchText: ''
    };

    summaryReport = await generateApplicationSummary(session, scheme);
    responseText = botString('applicationComplete', session.language || 'en', { scheme: session.selectedSchemeName! });
    
    session.messages.push({
      id: uuidv4(),
      role: 'assistant',
      content: responseText,
      timestamp: Date.now()
    });
  }

  saveSession(session);

  return res.json({
    sessionId: session.sessionId,
    activeMode: session.activeMode,
    nextQuestion,
    applicationAnswers: session.applicationAnswers,
    messages: session.messages,
    summaryReport
  });
});
