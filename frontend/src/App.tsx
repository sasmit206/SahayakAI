/**
 * App.tsx
 * Root component — session management, routing between views.
 * LanguageSwitcher added to header.
 * All labels use useLang() for i18n.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sahayakApi, CitizenProfile, ChatMessage, SchemeRecommendation, FormField, NextField } from './services/api';
import { ProfilePanel } from './components/ProfilePanel';
import { ChatPanel } from './components/ChatPanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { ApplicationFlowPanel } from './components/ApplicationFlowPanel';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ShieldAlert, Loader2, RefreshCw, ArrowLeft, Database, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from './context/LanguageContext';

export const App: React.FC = () => {
  const { t, language } = useLang();

  const [sessionId, setSessionId] = useState<string>('');
  const [profile, setProfile] = useState<CitizenProfile>({
    name: null, age: null, gender: null, state: null, income: null,
    occupation: null, maritalStatus: null, category: null, disabilityStatus: null,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMode, setActiveMode] = useState<'chat' | 'apply' | 'completed'>('chat');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [nextField, setNextField] = useState<NextField | null>(null);
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [report, setReport] = useState<string | null>(null);

  const [, setSelectedSchemeId] = useState<string | null>(null);
  const [selectedSchemeName, setSelectedSchemeName] = useState<string | null>(null);
  const [nextQuestion, setNextQuestion] = useState<FormField | null>(null);
  const [applicationAnswers, setApplicationAnswers] = useState<Record<string, any>>({});
  const [summaryReport, setSummaryReport] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<boolean>(false);

  const initialize = async () => {
    setIsInitializing(true);
    setInitError(false);
    try {
      const data = await sahayakApi.createSession(language);
      setSessionId(data.sessionId);
      setProfile(data.profile);
      setMessages(data.messages);
      setActiveMode(data.activeMode);
      setReport(data.recommendationReport);
      setNextField(data.nextField || null);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setInitError(true);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => { initialize(); }, []);

  const handleSendMessage = async (msg: string) => {
    setIsLoading(true);
    const userMsg: ChatMessage = { id: `temp-user-${Date.now()}`, role: 'user', content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const data = await sahayakApi.sendMessage(sessionId, msg, language);
      setProfile(data.profile);
      setMessages(data.messages);
      setActiveMode(data.activeMode);
      setMissingFields(data.missingFields || []);
      setNextField(data.nextField || null);
      setRecommendations(data.recommendations || []);
      setReport(data.report || null);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: `temp-error-${Date.now()}`, role: 'assistant',
        content: '⚠️ Connection error: Failed to reach the server. Please verify the backend is running and try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick-reply selection (buttons/dropdown) — sent as a structured field+value
  // pair, never as free text, so it can't fail to match on the backend.
  const handleQuickReply = async (field: string, displayValue: string, canonicalValue: string) => {
    setIsLoading(true);
    const userMsg: ChatMessage = { id: `temp-user-${Date.now()}`, role: 'user', content: displayValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const data = await sahayakApi.sendMessage(sessionId, '', language, { field, value: displayValue, canonicalValue });
      setProfile(data.profile);
      setMessages(data.messages);
      setActiveMode(data.activeMode);
      setMissingFields(data.missingFields || []);
      setNextField(data.nextField || null);
      setRecommendations(data.recommendations || []);
      setReport(data.report || null);
    } catch (error) {
      console.error('Failed to submit quick reply:', error);
      setMessages(prev => [...prev, {
        id: `temp-error-${Date.now()}`, role: 'assistant',
        content: '⚠️ Connection error: Failed to reach the server. Please verify the backend is running and try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const data = await sahayakApi.resetSession(sessionId, language);
      setProfile(data.profile);
      setMessages(data.messages);
      setActiveMode('chat');
      setMissingFields([]); setNextField((data as any).nextField || null); setRecommendations([]); setReport(null);
      setSelectedSchemeId(null); setSelectedSchemeName(null);
      setNextQuestion(null); setApplicationAnswers({}); setSummaryReport(null);
    } catch (error) {
      console.error('Failed to reset session:', error);
      setMessages(prev => [...prev, {
        id: `temp-reset-error-${Date.now()}`, role: 'assistant',
        content: '⚠️ Failed to reset the session. The server might be unreachable.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyScheme = async (schemeId: string, schemeName: string) => {
    setIsLoading(true);
    try {
      const data = await sahayakApi.selectScheme(sessionId, schemeId, schemeName);
      setActiveMode(data.activeMode);
      setSelectedSchemeId(data.selectedSchemeId);
      setSelectedSchemeName(data.selectedSchemeName);
      setNextQuestion(data.nextQuestion);
      setApplicationAnswers(data.applicationAnswers || {});
      setSummaryReport(null);
    } catch (error: any) {
      console.error('Failed to select scheme:', error);
      if (error.response?.status === 404) {
        alert('Your session has expired or the server has restarted. Please reload the page to start a new session.');
      } else {
        alert('Failed to start application flow. The server might be unreachable.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (val: any) => {
    setIsLoading(true);
    try {
      const data = await sahayakApi.submitAnswer(sessionId, val);
      setActiveMode(data.activeMode);
      setNextQuestion(data.nextQuestion);
      setApplicationAnswers(data.applicationAnswers || {});
      setMessages(data.messages);
      if (data.summaryReport) setSummaryReport(data.summaryReport);
    } catch (error: any) {
      console.error('Failed to submit answer:', error);
      if (error.response?.status === 404) {
        alert('Your session has expired or the server has restarted. Please reload the page to start a new session.');
      } else {
        alert('Failed to submit answer. Please check your network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToChat = () => setActiveMode('chat');

  /* ── Error state ── */
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-ink-950 text-ink-100 p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto h-11 w-11 grid place-items-center rounded-lg bg-danger/10 text-danger border border-danger/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-lg font-semibold text-white">{t.errorTitle}</h1>
          <p className="mt-2 text-sm text-ink-300 leading-relaxed">{t.errorBody}</p>
          <button onClick={initialize} className="btn-primary w-full mt-6">
            <RefreshCw className="h-4 w-4" />
            {t.errorRetry}
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-ink-950 text-ink-100">
        <Loader2 className="h-7 w-7 animate-spin text-ink-300 mb-4" strokeWidth={1.5} />
        <h1 className="text-base font-semibold tracking-tight text-white">{t.initTitle}</h1>
        <p className="text-[12.5px] text-ink-400 mt-1">{t.initSubtitle}</p>
      </div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-ink-950 text-ink-100">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/[0.06] bg-ink-950/90 backdrop-blur-md px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="btn-ghost text-[12.5px] px-2 py-1.5 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.backLabel}
          </Link>
          <div className="h-5 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-6 w-6 rounded-md bg-white text-ink-950 font-display font-bold text-[11px]">
              S
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-semibold tracking-tight text-[14px] text-white">
                {t.appName}
              </span>
              <span className="text-[11px] text-ink-400 font-mono">{t.appSubtitle}</span>
            </div>
          </div>
        </div>

        {/* Right side: pills + language switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <span className="pill-neutral">
              <Database className="h-3 w-3" />
              {t.versionLabel}
            </span>
            <span className="pill-success">
              <ShieldCheck className="h-3 w-3" />
              {t.engineLabel}
            </span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden p-5 gap-5">
        <div className="w-[28%] min-w-[320px] h-full flex-shrink-0">
          <ProfilePanel profile={profile} missingFields={missingFields} />
        </div>

        <div className="flex-1 h-full overflow-hidden">
          {activeMode === 'chat' ? (
            <div className="flex h-full gap-5">
              <div className="w-[52%] h-full flex-shrink-0">
                <ChatPanel
                  messages={messages}
                  nextField={nextField}
                  onSendMessage={handleSendMessage}
                  onQuickReply={handleQuickReply}
                  isLoading={isLoading}
                  onReset={handleReset}
                />
              </div>
              <div className="flex-1 h-full">
                <RecommendationsPanel
                  recommendations={recommendations}
                  report={report}
                  onApplyScheme={handleApplyScheme}
                  isApplying={isLoading}
                />
              </div>
            </div>
          ) : (
            <ApplicationFlowPanel
              schemeName={selectedSchemeName || 'Welfare Scheme Application'}
              nextQuestion={nextQuestion}
              applicationAnswers={applicationAnswers}
              summaryReport={summaryReport}
              onAnswerSubmit={handleAnswerSubmit}
              onBackToChat={handleBackToChat}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
