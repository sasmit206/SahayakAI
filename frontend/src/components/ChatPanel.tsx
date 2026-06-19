import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../services/api';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onReset: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, onReset }) => {
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
    <div className="surface flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-white">Casework assistant</h2>
          <p className="text-[11.5px] text-ink-400 mt-0.5">Natural-language intake dialogue</p>
        </div>
        <button onClick={onReset} className="btn-ghost text-[12px] px-2.5 py-1.5" title="Reset intake session">
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
            <Bot className="h-7 w-7 text-ink-500 mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-white font-medium">Ready to begin intake</p>
            <p className="mt-1.5 text-[12.5px] text-ink-400 max-w-xs leading-relaxed">
              Type the citizen’s story in your own words. Sahayak will extract a structured profile as you go.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-3 max-w-[88%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`h-7 w-7 rounded-md grid place-items-center border shrink-0 ${
                  isBot ? 'bg-ink-800 border-white/[0.06] text-ink-200' : 'bg-accent/15 border-accent/30 text-accent'
                }`}>
                  {isBot ? <Bot className="h-3.5 w-3.5" strokeWidth={1.5} /> : <User className="h-3.5 w-3.5" strokeWidth={1.5} />}
                </div>
                <div className={`px-4 py-2.5 rounded-xl text-[13.5px] leading-relaxed border ${
                  isBot
                    ? 'bg-ink-850 border-white/[0.05] text-ink-100 rounded-tl-sm'
                    : 'bg-accent/10 border-accent/20 text-white rounded-tr-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[88%]">
            <div className="h-7 w-7 rounded-md grid place-items-center border bg-ink-800 border-white/[0.06] text-ink-200">
              <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
            </div>
            <div className="bg-ink-850 border border-white/[0.05] px-4 py-3 rounded-xl rounded-tl-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-ink-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06] bg-ink-900">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type the citizen's statement…"
            className="input pr-11"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1.5 grid place-items-center h-8 w-8 rounded-md bg-white text-ink-950 hover:bg-ink-100 disabled:bg-ink-700 disabled:text-ink-500 transition-colors"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
};
export default ChatPanel;
