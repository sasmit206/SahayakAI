"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const sessionManager_1 = require("../forms/sessionManager");
const profileExtractor_1 = require("../profile/profileExtractor");
const profileBuilder_1 = require("../profile/profileBuilder");
const missingFieldDetector_1 = require("../profile/missingFieldDetector");
const recommendationEngine_1 = require("../recommendation/recommendationEngine");
const generator_1 = require("../rag/generator");
const questionFlow_1 = require("../forms/questionFlow");
const applicationBuilder_1 = require("../forms/applicationBuilder");
const dbService_1 = require("../services/dbService");
const uuid_1 = require("uuid");
const botStrings_1 = require("../i18n/botStrings");
exports.apiRouter = (0, express_1.Router)();
function normalizeDisabilityAnswer(message) {
    const normalized = message.trim().replace(/[\s.,!?;:]+$/g, '').replace(/^[\s.,!?;:]+/g, '');
    const lower = normalized.toLowerCase();
    if (/^(yes|true|1|y|हाँ|हां)$/i.test(normalized))
        return true;
    if (/^(no|false|0|n|none|नहीं)$/i.test(normalized))
        return false;
    if (/\bdoes(?:n['’]?t| not) have disability\b/i.test(lower) ||
        /\bdoes(?:n['’]?t| not) have any disability\b/i.test(lower) ||
        /\bhas no disability\b/i.test(lower) ||
        /\bnot disabled\b/i.test(lower) ||
        /\bwithout disability\b/i.test(lower) ||
        /\bnot handicapped\b/i.test(lower) ||
        /\bno handicap\b/i.test(lower)) {
        return false;
    }
    if (/\bhas disability\b/i.test(lower) ||
        /\bhas any disability\b/i.test(lower) ||
        /\bdisabled\b/i.test(lower) ||
        /\bhandicap(?:ped)?\b/i.test(lower) ||
        /\bdivyang\b/i.test(lower) ||
        /\bdifferently abled\b/i.test(lower)) {
        return true;
    }
    return null;
}
// Builds the nextField payload sent to the frontend, with translated option
// labels alongside the canonical (untranslated) values the profile stores.
function buildNextFieldPayload(nextField, lang) {
    if (!nextField)
        return null;
    return {
        key: nextField.key,
        inputType: nextField.inputType,
        options: nextField.options ? (0, botStrings_1.optionLabels)(nextField.options, lang) : undefined,
    };
}
// Create new session
exports.apiRouter.post('/session', (req, res) => {
    const language = (0, botStrings_1.normalizeLang)(req.body?.language);
    const session = (0, sessionManager_1.createSession)(language);
    const { nextField } = (0, missingFieldDetector_1.detectMissingFields)(session.profile);
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
exports.apiRouter.post('/reset', (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }
    const language = req.body?.language ? (0, botStrings_1.normalizeLang)(req.body.language) : undefined;
    const session = (0, sessionManager_1.resetSession)(sessionId, language);
    const { nextField } = (0, missingFieldDetector_1.detectMissingFields)(session.profile);
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
exports.apiRouter.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = (0, sessionManager_1.getSession)(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(session);
});
// Chat endpoint ( natural language conversation and profile extraction )
// Accepts either free-text `message`, or a structured quick-reply
// `{ quickReply: { field, value } }` for buttons/dropdown selections —
// the latter bypasses all NLU/regex and can never fail to match.
exports.apiRouter.post('/chat', async (req, res) => {
    const { sessionId, message, quickReply } = req.body;
    if (!sessionId || (!message && !quickReply)) {
        return res.status(400).json({ error: 'sessionId and message (or quickReply) are required' });
    }
    let session = (0, sessionManager_1.getSession)(sessionId);
    if (!session) {
        // Fallback: create session if not found
        session = (0, sessionManager_1.createSession)(req.body?.language ? (0, botStrings_1.normalizeLang)(req.body.language) : 'en');
        session.sessionId = sessionId;
        (0, sessionManager_1.saveSession)(session);
    }
    // Allow the citizen to switch language mid-conversation via the UI toggle
    if (req.body?.language) {
        session.language = (0, botStrings_1.normalizeLang)(req.body.language);
    }
    const lang = session.language || 'en';
    if (quickReply && quickReply.field && quickReply.value !== undefined) {
        // Structured selection from a button/dropdown — deterministic, no NLU involved.
        const fieldKey = quickReply.field;
        const displayValue = String(quickReply.value);
        session.messages.push({
            id: (0, uuid_1.v4)(),
            role: 'user',
            content: displayValue,
            timestamp: Date.now()
        });
        session.profile = (0, profileExtractor_1.applyDirectFieldValue)(fieldKey, quickReply.canonicalValue ?? quickReply.value, session.profile);
    }
    else {
        // 1. Add free-text user message to session
        session.messages.push({
            id: (0, uuid_1.v4)(),
            role: 'user',
            content: message,
            timestamp: Date.now()
        });
        // 2. Extract profile fields via NLU/regex
        console.log(`[API] Extracting profile fields from user statement: "${message}"`);
        const extracted = await (0, profileExtractor_1.extractProfile)(message, session.profile);
        session.profile = (0, profileBuilder_1.mergeProfile)(session.profile, extracted);
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
    const { missingFields, nextField } = (0, missingFieldDetector_1.detectMissingFields)(session.profile);
    let responseMessage = '';
    let recommendations = [];
    let report = null;
    if (missingFields.length > 0) {
        // Still missing fields, ask for the next one
        responseMessage = nextField ? (0, botStrings_1.questionFor)(nextField.key, lang) : (0, botStrings_1.botString)('askMore', lang);
    }
    else {
        // Profile is complete! Trigger recommendation pipeline
        console.log('[API] Profile is complete! Triggering recommendation engine...');
        try {
            const { recommendations: recs, rawScored } = await (0, recommendationEngine_1.getRecommendations)(session.profile, message || '', 5, lang);
            recommendations = recs;
            // Generate RAG report using Groq
            report = await (0, generator_1.generateRecommendationsReport)(session.profile, rawScored, lang);
            session.recommendationReport = report;
            responseMessage = (0, botStrings_1.botString)('recsReady', lang);
        }
        catch (err) {
            console.error('[API] Failed to generate recommendations:', err);
            responseMessage = (0, botStrings_1.botString)('recsError', lang);
        }
    }
    // 4. Add assistant response to session
    session.messages.push({
        id: (0, uuid_1.v4)(),
        role: 'assistant',
        content: responseMessage,
        timestamp: Date.now()
    });
    (0, sessionManager_1.saveSession)(session);
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
exports.apiRouter.post('/select-scheme', (req, res) => {
    const { sessionId, schemeId, schemeName } = req.body;
    if (!sessionId || !schemeId || !schemeName) {
        return res.status(400).json({ error: 'sessionId, schemeId, and schemeName are required' });
    }
    const session = (0, sessionManager_1.getSession)(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    // Start application FSM
    (0, questionFlow_1.startApplication)(session, schemeId, schemeName);
    const nextQuestion = (0, questionFlow_1.getCurrentQuestion)(session);
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
exports.apiRouter.post('/submit-answer', async (req, res) => {
    const { sessionId, answer } = req.body;
    if (!sessionId || answer === undefined) {
        return res.status(400).json({ error: 'sessionId and answer are required' });
    }
    const session = (0, sessionManager_1.getSession)(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    if (session.activeMode !== 'apply') {
        return res.status(400).json({ error: 'Session is not in application mode' });
    }
    // Get current question details for message history
    const currentQuestion = (0, questionFlow_1.getCurrentQuestion)(session);
    if (!currentQuestion) {
        return res.status(400).json({ error: 'No active question found' });
    }
    // Add user answer to message history
    session.messages.push({
        id: (0, uuid_1.v4)(),
        role: 'user',
        content: `${currentQuestion.label}: ${answer}`,
        timestamp: Date.now()
    });
    // Progress the FSM
    const { nextQuestion } = (0, questionFlow_1.submitAnswerAndProgress)(session, answer);
    let summaryReport = null;
    let responseText = '';
    if (nextQuestion) {
        // Ask the next question
        responseText = `Question: ${nextQuestion.label}`;
        session.messages.push({
            id: (0, uuid_1.v4)(),
            role: 'assistant',
            content: responseText,
            timestamp: Date.now()
        });
    }
    else {
        // Form is completed! Generate final summary
        console.log('[API] Form complete! Compiling final summary report...');
        const schemes = (0, dbService_1.getAllSchemes)();
        const scheme = schemes.find(s => s.schemeId === session.selectedSchemeId) || {
            schemeId: session.selectedSchemeId,
            schemeName: session.selectedSchemeName,
            slug: session.selectedSchemeId,
            level: 'State',
            category: [],
            tags: [],
            states: [],
            gender: 'All',
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
        summaryReport = await (0, applicationBuilder_1.generateApplicationSummary)(session, scheme);
        responseText = (0, botStrings_1.botString)('applicationComplete', session.language || 'en', { scheme: session.selectedSchemeName });
        session.messages.push({
            id: (0, uuid_1.v4)(),
            role: 'assistant',
            content: responseText,
            timestamp: Date.now()
        });
    }
    (0, sessionManager_1.saveSession)(session);
    return res.json({
        sessionId: session.sessionId,
        activeMode: session.activeMode,
        nextQuestion,
        applicationAnswers: session.applicationAnswers,
        messages: session.messages,
        summaryReport
    });
});
