"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startApplication = startApplication;
exports.getCurrentQuestion = getCurrentQuestion;
exports.submitAnswerAndProgress = submitAnswerAndProgress;
const sessionManager_1 = require("./sessionManager");
const schemeFormConfigs_1 = require("./schemeFormConfigs");
function startApplication(session, schemeId, schemeName) {
    const formConfig = (0, schemeFormConfigs_1.getFormConfigForScheme)(schemeId, schemeName);
    session.activeMode = 'apply';
    session.selectedSchemeId = schemeId;
    session.selectedSchemeName = schemeName;
    session.formConfig = formConfig;
    session.applicationAnswers = {};
    session.currentFormQuestionIndex = 0;
    (0, sessionManager_1.saveSession)(session);
    return session;
}
function getCurrentQuestion(session) {
    if (!session.formConfig || session.currentFormQuestionIndex === -1)
        return null;
    const fields = session.formConfig.fields;
    if (session.currentFormQuestionIndex < fields.length) {
        return fields[session.currentFormQuestionIndex];
    }
    return null;
}
function submitAnswerAndProgress(session, answer) {
    if (!session.formConfig || session.currentFormQuestionIndex === -1) {
        throw new Error('No active application workflow to submit answers to.');
    }
    const fields = session.formConfig.fields;
    const currentField = fields[session.currentFormQuestionIndex];
    // Store the collected answer
    session.applicationAnswers[currentField.key] = answer;
    // Advance state
    session.currentFormQuestionIndex++;
    let nextQuestion = null;
    if (session.currentFormQuestionIndex < fields.length) {
        nextQuestion = fields[session.currentFormQuestionIndex];
    }
    else {
        // Transition to completed when all form questions are answered
        session.activeMode = 'completed';
    }
    (0, sessionManager_1.saveSession)(session);
    return { session, nextQuestion };
}
exports.default = startApplication;
