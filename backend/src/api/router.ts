import { Router, Request, Response } from 'express';
import { createSession, getSession, saveSession, resetSession, ChatMessage } from '../forms/sessionManager';
import { extractProfile } from '../profile/profileExtractor';
import { mergeProfile } from '../profile/profileBuilder';
import { detectMissingFields } from '../profile/missingFieldDetector';
import { getRecommendations } from '../recommendation/recommendationEngine';
import { generateRecommendationsReport } from '../rag/generator';
import { startApplication, getCurrentQuestion, submitAnswerAndProgress } from '../forms/questionFlow';
import { generateApplicationSummary } from '../forms/applicationBuilder';
import { getAllSchemes } from '../services/dbService';
import { v4 as uuidv4 } from 'uuid';

export const apiRouter = Router();

// Create new session
apiRouter.post('/session', (req: Request, res: Response) => {
  const session = createSession();
  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    recommendationReport: session.recommendationReport
  });
});

// Reset session
apiRouter.post('/reset', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  const session = resetSession(sessionId);
  return res.json({
    sessionId: session.sessionId,
    profile: session.profile,
    messages: session.messages,
    activeMode: session.activeMode,
    selectedSchemeId: session.selectedSchemeId,
    selectedSchemeName: session.selectedSchemeName,
    recommendationReport: session.recommendationReport
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
apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { sessionId, message } = req.body;
  
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  let session = getSession(sessionId);
  if (!session) {
    // Fallback: create session if not found
    session = createSession();
    session.sessionId = sessionId;
    saveSession(session);
  }

  // 1. Add user message to session
  const userMsg: ChatMessage = {
    id: uuidv4(),
    role: 'user',
    content: message,
    timestamp: Date.now()
  };
  session.messages.push(userMsg);

  // 2. Extract profile fields
  console.log(`[API] Extracting profile fields from user statement: "${message}"`);
  const extracted = await extractProfile(message, session.profile);
  session.profile = mergeProfile(session.profile, extracted);

  // 3. Detect missing fields
  const { missingFields, nextQuestion } = detectMissingFields(session.profile);

  let responseMessage = '';
  let recommendations: any[] = [];
  let report: string | null = null;

  if (missingFields.length > 0) {
    // Still missing fields, ask for them
    responseMessage = nextQuestion || 'Could you please provide more details about the citizen?';
  } else {
    // Profile is complete! Trigger recommendation pipeline
    console.log('[API] Profile is complete! Triggering recommendation engine...');
    try {
      const { recommendations: recs, rawScored } = await getRecommendations(session.profile, message);
      recommendations = recs;
      
      // Generate RAG report using Groq
      report = await generateRecommendationsReport(session.profile, rawScored);
      session.recommendationReport = report;
      responseMessage = "I have successfully compiled the citizen's profile and identified the top welfare schemes they qualify for. You can review the recommendations and report in the panel on the right.";
    } catch (err) {
      console.error('[API] Failed to generate recommendations:', err);
      responseMessage = "I have collected the profile details, but encountered an error generating recommendations. Please check your vector database and connection.";
    }
  }

  // 4. Add assistant response to session
  const assistantMsg: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: responseMessage,
    timestamp: Date.now()
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
    responseText = `Great! I have collected all the application details for **${session.selectedSchemeName}** and compiled a professional Casework Application Summary briefing. You can review and print it in the workspace panel.`;
    
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
