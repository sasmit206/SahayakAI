/**
 * applicationBuilder.ts
 * Generates the final application summary document after all form questions
 * are answered. Language is passed through from the session/router so the
 * LLM-generated output matches the user's selected language.
 */
import { config } from '../config/env';
import { CaseworkSession } from './sessionManager';
import { SchemeDocument } from '../ingestion/normalizer';
import { SupportedLanguage } from '../i18n/backendStrings';
import { generateApplicationSummaryWithLanguage } from '../rag/generator';

export async function generateApplicationSummary(
  session: CaseworkSession,
  scheme: SchemeDocument,
  language: SupportedLanguage = 'en'
): Promise<string> {
  const profile = session.profile;
  const answers = session.applicationAnswers;

  const formattedAnswers = Object.entries(answers)
    .map(([key, val]) => {
      const field = session.formConfig?.fields.find((f: any) => f.key === key);
      const label = field ? field.label : key;
      return `- **${label}:** ${val}`;
    })
    .join('\n');

  return generateApplicationSummaryWithLanguage(
    {
      profile,
      applicationAnswers: answers,
      formConfig: session.formConfig,
      selectedSchemeName: session.selectedSchemeName,
    },
    scheme,
    formattedAnswers,
    language
  );
}

export default generateApplicationSummary;
