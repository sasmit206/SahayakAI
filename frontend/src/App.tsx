import React, { useState, useEffect } from 'react';
import { sahayakApi, CitizenProfile, ChatMessage, SchemeRecommendation, FormField } from './services/api';
import { ProfilePanel } from './components/ProfilePanel';
import { ChatPanel } from './components/ChatPanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { ApplicationFlowPanel } from './components/ApplicationFlowPanel';
import { ShieldAlert, BookOpen, Loader2, Sparkles, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [profile, setProfile] = useState<CitizenProfile>({
    name: null,
    age: null,
    gender: null,
    state: null,
    income: null,
    occupation: null,
    maritalStatus: null,
    category: null,
    disabilityStatus: null,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeMode, setActiveMode] = useState<'chat' | 'apply' | 'completed'>('chat');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<SchemeRecommendation[]>([]);
  const [report, setReport] = useState<string | null>(null);

  // Application workflow specific state
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
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
      const data = await sahayakApi.createSession();
      setSessionId(data.sessionId);
      setProfile(data.profile);
      setMessages(data.messages);
      setActiveMode(data.activeMode);
      setReport(data.recommendationReport);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setInitError(true);
    } finally {
      setIsInitializing(false);
    }
  };

  // Initialize intake session on mount
  useEffect(() => {
    initialize();
  }, []);

  const handleSendMessage = async (msg: string) => {
    setIsLoading(true);
    // Optimistic Update: Add user's message immediately
    const userMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const data = await sahayakApi.sendMessage(sessionId, msg);
      setProfile(data.profile);
      setMessages(data.messages);
      setActiveMode(data.activeMode);
      setMissingFields(data.missingFields || []);
      setRecommendations(data.recommendations || []);
      setReport(data.report || null);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Append an assistant message indicating failure so the user is informed
      const errorMsg: ChatMessage = {
        id: `temp-error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Connection error: Failed to reach the server. Please verify the backend is running and try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const data = await sahayakApi.resetSession(sessionId);
      setProfile(data.profile);
      setMessages(data.messages);
      setActiveMode('chat');
      setMissingFields([]);
      setRecommendations([]);
      setReport(null);
      setSelectedSchemeId(null);
      setSelectedSchemeName(null);
      setNextQuestion(null);
      setApplicationAnswers({});
      setSummaryReport(null);
    } catch (error) {
      console.error('Failed to reset session:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `temp-reset-error-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Failed to reset the session. The server might be unreachable.',
          timestamp: Date.now()
        }
      ]);
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
      if (data.summaryReport) {
        setSummaryReport(data.summaryReport);
      }
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

  const handleBackToChat = () => {
    setActiveMode('chat');
    // Maintain answers and summary in session but return to intake view
  };

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full border border-rose-500/20 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
          <div className="bg-rose-500/10 p-3 rounded-full border border-rose-500/20 text-rose-400 w-fit mx-auto mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">Connection Failure</h1>
          <p className="text-sm text-slate-400 mb-6">
            Unable to connect to the Sahayak AI backend server. Please make sure the backend server is running on port 5001.
          </p>
          <button
            onClick={initialize}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer border border-indigo-500/30"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <h1 className="text-xl font-bold tracking-tight">Initializing Sahayak AI Platform...</h1>
        <p className="text-sm text-slate-400 mt-1">Connecting to server and caching database index</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden text-slate-100">
      {/* Top Navigation / Dashboard Header */}
      <header className="flex-shrink-0 bg-slate-900/40 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 p-2.5 rounded-xl text-white font-black text-xl shadow-lg shadow-indigo-500/10">
            🤝
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Sahayak AI
              <span className="flex items-center gap-0.5 bg-indigo-500/15 border border-indigo-500/30 text-[10px] text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="h-2.5 w-2.5" />
                V1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Gov Welfare Scheme Decision-Support Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            V1 CSV Mode
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            Deterministic Eligibility Engine
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Side: Citizen Profile Intake Display (30% width) */}
        <div className="w-[30%] h-full flex-shrink-0">
          <ProfilePanel profile={profile} missingFields={missingFields} />
        </div>

        {/* Right Side: Intake Dialogue OR Application workflow (70% width) */}
        <div className="flex-1 h-full overflow-hidden">
          {activeMode === 'chat' ? (
            <div className="flex h-full gap-6">
              {/* Intake Chat Panel (40% width) */}
              <div className="w-[55%] h-full flex-shrink-0">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onReset={handleReset}
                />
              </div>

              {/* Recommendations view (45% width) */}
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
            /* Application form progression / FSM mode */
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
