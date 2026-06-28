"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getSession = getSession;
exports.saveSession = saveSession;
exports.resetSession = resetSession;
const uuid_1 = require("uuid");
const profileExtractor_1 = require("../profile/profileExtractor");
const SESSIONS_STORE = new Map();
function createSession() {
    const sessionId = (0, uuid_1.v4)();
    const session = {
        sessionId,
        profile: { ...profileExtractor_1.INITIAL_PROFILE },
        messages: [
            {
                id: (0, uuid_1.v4)(),
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
function getSession(sessionId) {
    return SESSIONS_STORE.get(sessionId);
}
function saveSession(session) {
    SESSIONS_STORE.set(session.sessionId, session);
}
function resetSession(sessionId) {
    const oldSession = SESSIONS_STORE.get(sessionId);
    const newSession = createSession();
    if (oldSession) {
        newSession.sessionId = oldSession.sessionId;
    }
    SESSIONS_STORE.set(newSession.sessionId, newSession);
    return newSession;
}
