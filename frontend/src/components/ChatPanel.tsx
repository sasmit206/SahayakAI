/**
 * ChatPanel.tsx
 * Enhanced chat experience:
 *   - Message grouping (consecutive same-role messages grouped)
 *   - Relative timestamps
 *   - Streaming-like reveal animation per message
 *   - Better empty state
 *   - Smooth auto-scroll
 *   - Accessible labels
 *   - Full i18n
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../services/api';
import { Send, Bot, User, RefreshCw, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { translateChatbotMessage } from '../i18n/translations';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onReset: () => void;
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages, onSendMessage, isLoading, onReset,
}) => {
  const { t, language } = useLang();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  // Group consecutive messages from same role
  const grouped: { role: 'user' | 'assistant'; msgs: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const last = grouped[grouped.length - 1];
    if (last && last.role === msg.role) {
      last.msgs.push(msg);
    } else {
      grouped.push({ role: msg.role, msgs: [msg] });
    }
  }

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-accent/15 border border-accent/30 grid place-items-center">
            <MessageSquare className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold tracking-tight text-white">{t.chatTitle}</h2>
            <p className="text-[11px] text-ink-400">{t.chatSubtitle}</p>
          </div>
        </div>
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="btn-ghost text-[12px] px-2.5 py-1.5"
          aria-label="Reset session"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t.resetLabel}
        </motion.button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 space-y-5"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-center px-6 py-12"
          >
            <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 grid place-items-center mb-4">
              <Bot className="h-6 w-6 text-accent" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] text-white font-semibold">{t.chatEmptyTitle}</p>
            <p className="mt-2 text-[12.5px] text-ink-400 max-w-xs leading-relaxed">{t.chatEmptyBody}</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {grouped.map((group, gi) => {
            const isBot = group.role === 'assistant';
            return (
              <motion.div
                key={`group-${gi}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar — shown once per group */}
                <div className={`h-7 w-7 rounded-lg grid place-items-center border shrink-0 mt-0.5 self-start ${
                  isBot
                    ? 'bg-ink-800 border-white/[0.06] text-ink-200'
                    : 'bg-accent/15 border-accent/25 text-accent'
                }`}>
                  {isBot
                    ? <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
                    : <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                  }
                </div>

                {/* Bubble stack */}
                <div className={`flex flex-col gap-1 max-w-[82%] ${isBot ? 'items-start' : 'items-end'}`}>
                  {group.msgs.map((msg, mi) => (
                    <div key={msg.id}>
                      <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed border ${
                        isBot
                          ? `bg-ink-850 border-white/[0.05] text-ink-100 ${mi === 0 ? 'rounded-tl-sm' : ''}`
                          : `bg-accent/10 border-accent/20 text-white ${mi === 0 ? 'rounded-tr-sm' : ''}`
                      }`}>
                        {msg.role === 'assistant'
                          ? translateChatbotMessage(msg.content, language)
                          : msg.content
                        }
                      </div>
                      {/* Timestamp on last bubble of group */}
                      {mi === group.msgs.length - 1 && (
                        <p className={`text-[10.5px] text-ink-600 mt-1 px-1 ${isBot ? 'text-left' : 'text-right'}`}>
                          {formatTimestamp(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-2.5"
          >
            <div className="h-7 w-7 rounded-lg grid place-items-center border bg-ink-800 border-white/[0.06] text-ink-200 shrink-0">
              <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
            </div>
            <div className="bg-ink-850 border border-white/[0.05] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-ink-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06] bg-ink-900/60">
        <div className="relative">
          <motion.input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={t.chatPlaceholder}
            whileFocus={{ scale: 1.005 }}
            transition={{ duration: 0.15 }}
            className="input pr-11 text-[13.5px]"
            aria-label={t.chatPlaceholder}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="absolute right-1.5 top-1.5 grid place-items-center h-8 w-8 rounded-lg bg-white text-ink-950 hover:bg-ink-100 disabled:bg-ink-700 disabled:text-ink-500 transition-colors"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
