import { CaseworkSession, saveSession } from './sessionManager';
import { getFormConfigForScheme, FormField } from './schemeFormConfigs';

export function startApplication(
  session: CaseworkSession,
  schemeId: string,
  schemeName: string
): CaseworkSession {
  const formConfig = getFormConfigForScheme(schemeId, schemeName);
  
  session.activeMode = 'apply';
  session.selectedSchemeId = schemeId;
  session.selectedSchemeName = schemeName;
  session.formConfig = formConfig;
  session.applicationAnswers = {};
  session.currentFormQuestionIndex = 0;
  
  saveSession(session);
  return session;
}

export function getCurrentQuestion(session: CaseworkSession): FormField | null {
  if (!session.formConfig || session.currentFormQuestionIndex === -1) return null;
  const fields = session.formConfig.fields;
  if (session.currentFormQuestionIndex < fields.length) {
    return fields[session.currentFormQuestionIndex];
  }
  return null;
}

export function submitAnswerAndProgress(
  session: CaseworkSession,
  answer: any
): { session: CaseworkSession; nextQuestion: FormField | null } {
  if (!session.formConfig || session.currentFormQuestionIndex === -1) {
    throw new Error('No active application workflow to submit answers to.');
  }
  
  const fields = session.formConfig.fields;
  const currentField = fields[session.currentFormQuestionIndex];
  
  // Store the collected answer
  session.applicationAnswers[currentField.key] = answer;
  
  // Advance state
  session.currentFormQuestionIndex++;
  
  let nextQuestion: FormField | null = null;
  if (session.currentFormQuestionIndex < fields.length) {
    nextQuestion = fields[session.currentFormQuestionIndex];
  } else {
    // Transition to completed when all form questions are answered
    session.activeMode = 'completed';
  }
  
  saveSession(session);
  return { session, nextQuestion };
}
export default startApplication;
