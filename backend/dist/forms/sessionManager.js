"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getSession = getSession;
exports.saveSession = saveSession;
exports.resetSession = resetSession;
const uuid_1 = require("uuid");
const profileExtractor_1 = require("../profile/profileExtractor");
const botStrings_1 = require("../i18n/botStrings");
const SESSIONS_STORE = new Map();
function createSession(language = 'en') {
    const sessionId = (0, uuid_1.v4)();
    const session = {
        sessionId,
        profile: { ...profileExtractor_1.INITIAL_PROFILE },
        messages: [
            {
                id: (0, uuid_1.v4)(),
                role: 'assistant',
                content: (0, botStrings_1.botString)('welcome', language),
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
function getSession(sessionId) {
    return SESSIONS_STORE.get(sessionId);
}
function saveSession(session) {
    SESSIONS_STORE.set(session.sessionId, session);
}
function resetSession(sessionId, language) {
    const oldSession = SESSIONS_STORE.get(sessionId);
    const newSession = createSession(language ?? oldSession?.language ?? 'en');
    if (oldSession) {
        newSession.sessionId = oldSession.sessionId;
    }
    SESSIONS_STORE.set(newSession.sessionId, newSession);
    return newSession;
}
