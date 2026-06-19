import React, { useState } from 'react';
import { FormField } from '../services/api';
import { ArrowLeft, ClipboardCheck, ArrowRight, Printer, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApplicationFlowPanelProps {
  schemeName: string;
  nextQuestion: FormField | null;
  applicationAnswers: Record<string, any>;
  summaryReport: string | null;
  onAnswerSubmit: (val: any) => void;
  onBackToChat: () => void;
  isLoading: boolean;
}

export const ApplicationFlowPanel: React.FC<ApplicationFlowPanelProps> = ({
  schemeName, nextQuestion, applicationAnswers, summaryReport,
  onAnswerSubmit, onBackToChat, isLoading,
}) => {
  const [currentValue, setCurrentValue] = useState<any>('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !nextQuestion) return;

    if (nextQuestion.type === 'boolean') {
      onAnswerSubmit(currentValue === 'true' || currentValue === true);
      setCurrentValue('');
    } else if (nextQuestion.type === 'choice') {
      if (!currentValue) return setErrorMessage('Please select an option');
      onAnswerSubmit(currentValue); setCurrentValue('');
    } else if (nextQuestion.type === 'number') {
      const parsed = parseFloat(currentValue);
      if (isNaN(parsed)) return setErrorMessage('Please enter a valid number');
      onAnswerSubmit(parsed); setCurrentValue('');
    } else {
      if (!currentValue.trim()) return setErrorMessage('This field is required');
      onAnswerSubmit(currentValue.trim()); setCurrentValue('');
    }
    setErrorMessage('');
  };

  const answeredEntries = Object.entries(applicationAnswers);

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBackToChat} className="btn-ghost px-2 py-1.5 text-[12.5px]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="h-5 w-px bg-white/[0.08]" />
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-white">{schemeName}</h2>
            <p className="text-[11.5px] text-ink-400 mt-0.5">
              {summaryReport ? 'Application summary' : 'Deterministic application flow'}
            </p>
          </div>
        </div>
        {summaryReport && (
          <button onClick={() => window.print()} className="btn-secondary text-[12.5px] px-3 py-1.5">
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-3xl mx-auto">
          {summaryReport ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg grid place-items-center bg-success/10 border border-success/20 text-success">
                  <ClipboardCheck className="h-4 w-4" strokeWidth={1.6} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-[16px]">Application complete</h3>
                  <p className="text-[12.5px] text-ink-400">Summary report ready for review</p>
                </div>
              </div>
              <div className="surface-muted p-6 report-prose">{summaryReport}</div>
            </motion.div>
          ) : nextQuestion ? (
            <motion.form
              key={nextQuestion.key}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-ink-400" strokeWidth={1.6} />
                <span className="text-[11px] uppercase tracking-[0.12em] text-ink-400 font-medium">
                  Question · field <span className="font-mono">{nextQuestion.key}</span>
                </span>
              </div>

              <h3 className="font-display text-white text-2xl tracking-tightest font-semibold leading-tight">
                {nextQuestion.label}
              </h3>

              <div className="space-y-3">
                {nextQuestion.type === 'choice' && nextQuestion.choices ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {nextQuestion.choices.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCurrentValue(c)}
                        className={`text-left px-4 py-3 rounded-lg border text-[13.5px] transition-colors ${
                          currentValue === c
                            ? 'bg-white text-ink-950 border-white'
                            : 'bg-ink-850 text-ink-100 border-white/[0.06] hover:border-white/[0.16]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : nextQuestion.type === 'boolean' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[['true', 'Yes'], ['false', 'No']].map(([val, lbl]) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setCurrentValue(val)}
                        className={`px-4 py-3 rounded-lg border text-[13.5px] transition-colors ${
                          currentValue === val
                            ? 'bg-white text-ink-950 border-white'
                            : 'bg-ink-850 text-ink-100 border-white/[0.06] hover:border-white/[0.16]'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type={nextQuestion.type === 'number' ? 'number' : 'text'}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder={nextQuestion.placeholder || 'Type your answer…'}
                    className="input"
                    autoFocus
                  />
                )}

                {errorMessage && (
                  <p className="flex items-center gap-1.5 text-[12.5px] text-danger">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errorMessage}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[12px] text-ink-400 font-mono">
                  {answeredEntries.length} answered
                </span>
                <button type="submit" disabled={isLoading} className="btn-primary text-[13px] px-5 py-2.5">
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.form>
          ) : (
            <div className="text-center py-16 text-ink-400 text-[13px]">Preparing next question…</div>
          )}

          {answeredEntries.length > 0 && !summaryReport && (
            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-400 font-medium mb-4">
                Answers captured
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
