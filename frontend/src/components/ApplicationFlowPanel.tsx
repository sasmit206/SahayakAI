import React, { useState } from 'react';
import { FormField } from '../services/api';
import { ArrowLeft, Check, ClipboardCheck, ArrowRight, Printer, AlertTriangle, HelpCircle } from 'lucide-react';

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
  schemeName,
  nextQuestion,
  applicationAnswers,
  summaryReport,
  onAnswerSubmit,
  onBackToChat,
  isLoading,
}) => {
  const [currentValue, setCurrentValue] = useState<any>('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validation
    if (nextQuestion) {
      if (nextQuestion.type === 'boolean') {
        onAnswerSubmit(currentValue === 'true' || currentValue === true);
        setCurrentValue('');
      } else if (nextQuestion.type === 'choice') {
        if (!currentValue) {
          setErrorMessage('Please select an option');
          return;
        }
        onAnswerSubmit(currentValue);
        setCurrentValue('');
      } else if (nextQuestion.type === 'number') {
        const parsed = parseFloat(currentValue);
        if (isNaN(parsed)) {
          setErrorMessage('Please enter a valid number');
          return;
        }
        onAnswerSubmit(parsed);
        setCurrentValue('');
      } else {
        if (!currentValue.trim()) {
          setErrorMessage('This field is required');
          return;
        }
        onAnswerSubmit(currentValue.trim());
        setCurrentValue('');
      }
      setErrorMessage('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-bold text-slate-100">{schemeName}</h2>
            <p className="text-xs text-slate-400">
              {summaryReport ? 'Application Summary' : 'Deterministic Application Flow'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-6">
        {summaryReport ? (
          /* Finished State: Markdown summary */
          <div className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
              <div>
                <p className="text-sm font-bold">Intake Questionnaire Complete!</p>
                <p className="text-xs text-slate-400">A briefing document has been compiled below.</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap p-6 bg-slate-950/40 border border-slate-900 rounded-2xl overflow-x-auto print:bg-white print:text-black">
              {summaryReport}
            </div>

            {/* Print and Return buttons */}
            <div className="flex items-center gap-3 justify-end border-t border-slate-800 pt-4">
              <button onClick={handlePrint} className="btn-secondary flex items-center gap-1.5 text-xs py-2.5">
                <Printer className="h-4 w-4" />
                Print Briefing
              </button>
              <button onClick={onBackToChat} className="btn-primary text-xs py-2.5">
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : nextQuestion ? (
          /* In Progress State: Form field question */
          <div className="max-w-xl mx-auto py-8">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                <span>Application Form Step</span>
                <span className="font-bold text-indigo-400">Deterministic Intake</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(10, (Object.keys(applicationAnswers).length / 6) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Card */}
            <form onSubmit={handleSubmit} className="glass-card p-6 border-slate-800 rounded-2xl space-y-6">
              <div className="flex gap-3 items-start">
                <div className="bg-indigo-500/20 p-2.5 rounded-lg border border-indigo-500/30 text-indigo-400 flex-shrink-0">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Required Answer</span>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5 leading-snug">
                    {nextQuestion.label}
                  </h3>
                </div>
              </div>

              {/* Dynamic Form Control */}
              <div className="space-y-2">
                {nextQuestion.type === 'choice' && nextQuestion.choices ? (
                  <div className="space-y-2">
                    {nextQuestion.choices.map((choice) => (
                      <label
                        key={choice}
                        className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                          currentValue === choice
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={nextQuestion.key}
                          value={choice}
                          checked={currentValue === choice}
                          onChange={() => {
                            setCurrentValue(choice);
                            setErrorMessage('');
                          }}
                          className="text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
                        />
                        <span className="text-sm font-medium">{choice}</span>
                      </label>
                    ))}
                  </div>
                ) : nextQuestion.type === 'boolean' ? (
                  <div className="flex gap-4">
                    {[
                      { label: 'Yes', val: true },
                      { label: 'No', val: false },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setCurrentValue(opt.val);
                          setErrorMessage('');
                        }}
                        className={`flex-1 p-3.5 border rounded-xl font-bold transition-all text-center text-sm ${
                          currentValue === opt.val
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : nextQuestion.type === 'number' ? (
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => {
                      setCurrentValue(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder={nextQuestion.placeholder || 'Enter value'}
                    className="w-full glass-input text-sm"
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => {
                      setCurrentValue(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder={nextQuestion.placeholder || 'Enter value'}
                    className="w-full glass-input text-sm"
                    autoFocus
                  />
                )}

                {errorMessage && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/10">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Form Action */}
              <div className="flex justify-end pt-2 border-t border-slate-800/80">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-1.5 text-xs py-2.5 px-4 font-bold"
                >
                  {isLoading ? 'Saving...' : 'Next Step'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">Loading form questionnaire...</div>
        )}
      </div>
    </div>
  );
};
export default ApplicationFlowPanel;
