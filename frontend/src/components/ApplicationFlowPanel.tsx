/**
 * ApplicationFlowPanel.tsx
 * Application form flow with:
 *   - Aadhaar / phone validation via ValidatedInput
 *   - Per-question slide transitions
 *   - PDF print of full report on completion
 *   - Full i18n
 */
import React, { useState, useEffect, useRef } from 'react';
import { FormField, CitizenProfile, SchemeRecommendation } from '../services/api';
import {
  ArrowLeft, ClipboardCheck, ArrowRight, Printer,
  AlertTriangle, HelpCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { ValidatedInput } from './ValidatedInput';
import { buildPdfHtml } from './PdfReport';
import { translateFormField } from '../i18n/translations';

interface ApplicationFlowPanelProps {
  schemeName: string;
  nextQuestion: FormField | null;
  applicationAnswers: Record<string, any>;
  summaryReport: string | null;
  onAnswerSubmit: (val: any) => void;
  onBackToChat: () => void;
  isLoading: boolean;
  profile: CitizenProfile;
  recommendations: SchemeRecommendation[];
}

function getVariant(key: string): 'aadhaar' | 'phone' | 'text' | 'number' {
  const k = key.toLowerCase();
  if (k.includes('aadhaar') || k.includes('aadhar')) return 'aadhaar';
  if (k.includes('phone') || k.includes('mobile') || k.includes('contact')) return 'phone';
  return 'text';
}

function printFullReport(
  profile: CitizenProfile,
  recommendations: SchemeRecommendation[],
  summaryReport: string,
  applicationId: string,
  language: 'en' | 'hi'
) {
  const html = buildPdfHtml({
    profile, recommendations, applicationId, language,
    generatedDate: new Date().toLocaleString(),
    conversationSummary: summaryReport,
  });
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 800);
}

export const ApplicationFlowPanel: React.FC<ApplicationFlowPanelProps> = ({
  schemeName, nextQuestion, applicationAnswers, summaryReport,
  onAnswerSubmit, onBackToChat, isLoading, profile, recommendations,
}) => {
  const { t, language } = useLang();
  const [currentValue, setCurrentValue] = useState<any>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [specialFieldValid, setSpecialFieldValid] = useState(false);
  const appIdRef = useRef(`APP-${Date.now().toString(36).toUpperCase()}`);

  useEffect(() => {
    setCurrentValue('');
    setErrorMessage('');
    setSpecialFieldValid(false);
  }, [nextQuestion?.key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !nextQuestion) return;

    if (nextQuestion.type === 'boolean') {
      onAnswerSubmit(currentValue === 'true' || currentValue === true);
      setCurrentValue('');
    } else if (nextQuestion.type === 'choice') {
      if (!currentValue) return setErrorMessage(t.selectOption);
      onAnswerSubmit(currentValue); setCurrentValue('');
    } else if (nextQuestion.type === 'number') {
      const parsed = parseFloat(currentValue);
      if (isNaN(parsed)) return setErrorMessage(t.invalidNumber);
      onAnswerSubmit(parsed); setCurrentValue('');
    } else {
      const variant = getVariant(nextQuestion.key);
      if ((variant === 'aadhaar' || variant === 'phone') && !specialFieldValid) {
        return setErrorMessage(variant === 'aadhaar' ? t.invalidAadhaar : t.invalidPhone);
      }
      if (!currentValue.trim()) return setErrorMessage(t.fieldRequired);
      onAnswerSubmit(currentValue.trim()); setCurrentValue('');
    }
    setErrorMessage('');
  };

  const answeredEntries = Object.entries(applicationAnswers);
  const variant = nextQuestion ? getVariant(nextQuestion.key) : 'text';
  const isSpecial = variant === 'aadhaar' || variant === 'phone';
  const submitDisabled = isLoading || (nextQuestion?.type === 'text' && isSpecial && !specialFieldValid);

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onBackToChat}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="btn-ghost px-2 py-1.5 text-[12.5px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />{t.appFlowBack}
          </motion.button>
          <div className="h-5 w-px bg-white/[0.08]" />
          <div>
            <h2 className="text-[14px] font-semibold tracking-tight text-white">{schemeName}</h2>
            <p className="text-[11px] text-ink-400">
              {summaryReport ? t.appFlowSummarySubtitle : t.appFlowSubtitle}
            </p>
          </div>
        </div>
        {summaryReport && (
          <motion.button
            onClick={() => printFullReport(profile, recommendations, summaryReport, appIdRef.current, language)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="btn-secondary text-[12px] px-3 py-1.5"
          >
            <Printer className="h-3.5 w-3.5" />{t.appFlowPrint}
          </motion.button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {summaryReport ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl grid place-items-center bg-success/10 border border-success/20 text-success">
                    <ClipboardCheck className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-[16px]">{t.appFlowComplete}</h3>
                    <p className="text-[12px] text-ink-400">{t.appFlowCompleteSubtitle}</p>
                  </div>
                </div>
                <div className="surface-muted p-6 report-prose">{summaryReport}</div>
              </motion.div>
            ) : nextQuestion ? (
              <motion.form
                key={nextQuestion.key}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-7"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-ink-400" strokeWidth={1.6} />
                  <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400 font-medium">
                    Field: <span className="font-mono">{nextQuestion.key}</span>
                  </span>
                </div>

                <h3 className="font-display text-white text-[22px] tracking-tight font-semibold leading-snug">
                  {translateFormField(nextQuestion.label, language)}
                </h3>

                <div className="space-y-3">
                  {nextQuestion.type === 'choice' && nextQuestion.choices ? (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {nextQuestion.choices.map((c) => (
                        <motion.button
                          type="button" key={c}
                          onClick={() => setCurrentValue(c)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className={`text-left px-4 py-3 rounded-xl border text-[13px] transition-colors ${
                            currentValue === c
                              ? 'bg-white text-ink-950 border-white'
                              : 'bg-ink-850 text-ink-100 border-white/[0.06] hover:border-white/20'
                          }`}
                        >{translateFormField(c, language)}</motion.button>
                      ))}
                    </div>
                  ) : nextQuestion.type === 'boolean' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[['true', 'Yes'], ['false', 'No']].map(([val, lbl]) => (
                        <motion.button
                          type="button" key={val}
                          onClick={() => setCurrentValue(val)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className={`px-4 py-3 rounded-xl border text-[13px] transition-colors ${
                            currentValue === val
                              ? 'bg-white text-ink-950 border-white'
                              : 'bg-ink-850 text-ink-100 border-white/[0.06] hover:border-white/20'
                          }`}
                        >{lbl}</motion.button>
                      ))}
                    </div>
                  ) : isSpecial ? (
                    <ValidatedInput
                      variant={variant as 'aadhaar' | 'phone'}
                      value={currentValue}
                      onChange={setCurrentValue}
                      onValidChange={setSpecialFieldValid}
                      placeholder={nextQuestion.placeholder || ''}
                      autoFocus disabled={isLoading}
                    />
                  ) : (
                    <input
                      type={nextQuestion.type === 'number' ? 'number' : 'text'}
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      placeholder={translateFormField(nextQuestion.placeholder || 'Type your answer…', language)}
                      className="input" autoFocus disabled={isLoading}
                    />
                  )}

                  <AnimatePresence>
                    {errorMessage && !isSpecial && (
                      <motion.p
                        key="err"
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-[12.5px] text-danger" role="alert"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />{errorMessage}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[12px] text-ink-400 font-mono">
                    {t.appFlowAnswered(answeredEntries.length)}
                  </span>
                  <motion.button
                    type="submit" disabled={submitDisabled}
                    whileHover={{ scale: submitDisabled ? 1 : 1.03 }}
                    whileTap={{ scale: submitDisabled ? 1 : 0.97 }}
                    className="btn-primary text-[13px] px-5 py-2.5"
                  >
                    {isLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <>{t.appFlowContinue}<ArrowRight className="h-3.5 w-3.5" /></>
                    }
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="preparing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-16 text-ink-400 text-[13px]"
              >
                {t.appFlowPreparing}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answered fields */}
          {answeredEntries.length > 0 && !summaryReport && (
            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-400 font-medium mb-4">
                {t.appFlowAnswersLabel}
              </p>
              <div className="space-y-1.5">
                {answeredEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 px-3 py-2 rounded-md hover:bg-white/[0.03]">
                    <span className="text-[12.5px] font-mono text-ink-400">{k}</span>
                    <span className="text-[13px] text-white flex items-center gap-2">
                      {String(v)}
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.8} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationFlowPanel;
