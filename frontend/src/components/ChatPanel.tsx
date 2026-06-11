import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../services/api';
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onReset: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onReset,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
            <Bot className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100">Casework Assistant</h2>
            <p className="text-xs text-slate-400">Natural Profile Intake</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95"
          title="Reset intake session"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Session
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                  isBot
                    ? 'bg-indigo-950 border-indigo-800/80 text-indigo-400'
                    : 'bg-emerald-950 border-emerald-800/80 text-emerald-400'
                }`}
              >
                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                  isBot
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-200 rounded-tl-none'
                    : 'bg-indigo-600/10 border-indigo-500/30 text-slate-100 rounded-tr-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center border bg-indigo-950 border-indigo-800/80 text-indigo-400">
              <Bot className="h-4 w-4 animate-bounce" />
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              Processing statement...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type citizen's responses or statement here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-4 pr-12 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white p-2 rounded-lg transition-colors active:scale-95 disabled:scale-100 focus:outline-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
export default ChatPanel;
