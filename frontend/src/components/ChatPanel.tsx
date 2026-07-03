/**
 * ChatPanel
 * - Quick-reply buttons/dropdown for determinate fields (gender, marital
 *   status, category, disability, state) — no more free-text loop risk.
 * - Voice in (mic) / voice out (auto-speak + per-message play) via Web Speech API.
 * - Hindi: live Tab-to-convert transliteration + on-screen virtual keyboard.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, NextField } from '../services/api';
import {
  Send, Bot, User, RefreshCw, Mic, MicOff, Volume2, VolumeX,
  Languages, Keyboard, Play, Square, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { useVoiceInput, useVoiceOutput } from '../hooks/useVoice';
import { transliterateToDevanagari, looksLikeLatinScript } from '../utils/transliterate';
import { HindiKeyboard } from './HindiKeyboard';

interface ChatPanelProps {
  messages: ChatMessage[];
  nextField: NextField | null;
  onSendMessage: (msg: string) => void;
  onQuickReply: (field: string, value: string, canonicalValue: string) => void;
  isLoading: boolean;
  onReset: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages, nextField, onSendMessage, onQuickReply, isLoading, onReset,
}) => {
  const { t, language } = useLang();
  const [input, setInput] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  const voiceOut = useVoiceOutput();
  const voiceIn = useVoiceInput({
    language,
    onResult: (transcript) => onSendMessage(transcript),
    onError: (err) => setMicError(err === 'denied' ? t.micPermissionDenied : err === 'unsupported' ? t.micUnsupported : null),
  });

  const isQuickReply = nextField && (nextField.inputType === 'buttons' || nextField.inputType === 'select');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-speak the newest assistant reply when voice-out is enabled.
  useEffect(() => {
    if (!voiceOut.enabled) return;
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant' && last.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = last.id;
      voiceOut.speak(last.id, last.content, language);
    }
  }, [messages, voiceOut.enabled, language]);

  // Live romanized-Hindi -> Devanagari suggestion (Hindi mode only).
  const transliteration = useMemo(() => {
    if (language !== 'hi' || !input.trim() || !looksLikeLatinScript(input)) return '';
    return transliterateToDevanagari(input);
  }, [language, input]);

  const acceptTransliteration = () => { if (transliteration) setInput(transliteration); };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && transliteration) {
      e.preventDefault();
      acceptTransliteration();
    }
  };

  const handleKeyboardKey = (ch: string) => setInput((prev) => prev + ch);
  const handleKeyboardBackspace = () => setInput((prev) => prev.slice(0, -1));
  const handleKeyboardSpace = () => setInput((prev) => prev + ' ');
  const handleKeyboardClear = () => setInput('');

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-white">{t.chatTitle}</h2>
          <p className="text-[11.5px] text-ink-400 mt-0.5">{t.chatSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {voiceOut.supported && (
            <motion.button
              onClick={voiceOut.toggle}
              whileTap={{ scale: 0.94 }}
              className={`btn-ghost text-[12px] px-2.5 py-1.5 ${voiceOut.enabled ? 'text-accent' : ''}`}
              title={voiceOut.enabled ? t.speakerOn : t.speakerOff}
              aria-pressed={voiceOut.enabled}
            >
              {voiceOut.enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </motion.button>
          )}
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn-ghost text-[12px] px-2.5 py-1.5"
            title="Reset intake session"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t.resetLabel}
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
            <Bot className="h-7 w-7 text-ink-500 mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-white font-medium">{t.chatEmptyTitle}</p>
            <p className="mt-1.5 text-[12.5px] text-ink-400 max-w-xs leading-relaxed">{t.chatEmptyBody}</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            const isPlayingThis = voiceOut.speakingId === msg.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-2.5 max-w-[88%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`h-7 w-7 rounded-md grid place-items-center border shrink-0 mt-0.5 ${
                  isBot ? 'bg-ink-800 border-white/[0.06] text-ink-200' : 'bg-accent/15 border-accent/30 text-accent'
                }`}>
                  {isBot ? <Bot className="h-3.5 w-3.5" strokeWidth={1.5} /> : <User className="h-3.5 w-3.5" strokeWidth={1.5} />}
                </div>
                <div className={`group relative px-4 py-2.5 rounded-xl text-[13.5px] leading-relaxed border ${
                  isBot
                    ? 'bg-ink-850 border-white/[0.05] text-ink-100 rounded-tl-sm'
                    : 'bg-accent/10 border-accent/20 text-white rounded-tr-sm'
                }`}>
                  {msg.content}
                  {isBot && voiceOut.supported && (
                    <button
                      type="button"
                      onClick={() => isPlayingThis ? voiceOut.stopSpeaking() : voiceOut.speak(msg.id, msg.content, language)}
                      title={isPlayingThis ? t.stopPlaying : t.playMessage}
                      className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full bg-ink-800 border border-white/[0.1] grid place-items-center text-ink-300 opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent/40 transition-all"
                    >
                      {isPlayingThis ? <Square className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2.5 max-w-[88%]">
            <div className="h-7 w-7 rounded-md grid place-items-center border bg-ink-800 border-white/[0.06] text-ink-200">
              <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
            </div>
            <div className="bg-ink-850 border border-white/[0.05] px-4 py-3 rounded-xl rounded-tl-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-ink-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick-reply buttons / dropdown for determinate fields — shown inline
            in the conversation, right under the bot's question. */}
        {!isLoading && isQuickReply && nextField?.options && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 max-w-[88%]"
          >
            <div className="h-7 w-7 shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-ink-400 mb-2">{t.chooseOption}</p>
              {nextField.inputType === 'buttons' ? (
                <div className="flex flex-wrap gap-2">
                  {nextField.options.map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      onClick={() => onQuickReply(nextField.key, opt.label, opt.value)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg border text-[13px] bg-ink-850 text-ink-100 border-white/[0.08] hover:border-accent/40 hover:bg-ink-800 transition-colors"
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="relative max-w-xs">
                  <select
                    defaultValue=""
                    disabled={isLoading}
                    onChange={(e) => {
                      const opt = nextField.options!.find((o) => o.value === e.target.value);
                      if (opt) onQuickReply(nextField.key, opt.label, opt.value);
                    }}
                    className="input appearance-none pr-9 cursor-pointer"
                  >
                    <option value="" disabled>{t.selectStatePlaceholder}</option>
                    {nextField.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06] bg-ink-900">
        <AnimatePresence>
          {showKeyboard && language === 'hi' && (
            <HindiKeyboard
              onKey={handleKeyboardKey}
              onBackspace={handleKeyboardBackspace}
              onSpace={handleKeyboardSpace}
              onClear={handleKeyboardClear}
              onClose={() => setShowKeyboard(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {micError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[11.5px] text-danger mb-2"
            >
              {micError}
            </motion.p>
          )}
          {transliteration && (
            <motion.button
              type="button"
              onClick={acceptTransliteration}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 flex items-center gap-2 w-full text-left px-3 py-2 rounded-md bg-ink-850 border border-white/[0.08] hover:border-accent/40 transition-colors"
              title={t.transliterateHint}
            >
              <Languages className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="text-[13.5px] text-white truncate">{transliteration}</span>
              <span className="ml-auto text-[10.5px] text-ink-400 shrink-0">{t.transliterateHint}</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Disable free text entirely while a quick-reply is pending — this is
            what removes the loop risk for these fields rather than just
            reducing it. */}
        <fieldset disabled={!!isQuickReply} className="relative flex items-center gap-2 disabled:opacity-50">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isLoading || !!isQuickReply}
              placeholder={voiceIn.isListening ? t.micListening : t.chatPlaceholder}
              className="input pr-11"
              aria-label={t.chatPlaceholder}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading || !!isQuickReply}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="absolute right-1.5 top-1.5 grid place-items-center h-8 w-8 rounded-md bg-white text-ink-950 hover:bg-ink-100 disabled:bg-ink-700 disabled:text-ink-500 transition-colors"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </motion.button>
          </div>

          {language === 'hi' && (
            <motion.button
              type="button"
              onClick={() => setShowKeyboard((v) => !v)}
              disabled={isLoading || !!isQuickReply}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              title={t.keyboardToggle}
              className={`shrink-0 grid place-items-center h-10 w-10 rounded-md border transition-colors ${
                showKeyboard
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-ink-850 border-white/[0.08] text-ink-200 hover:border-white/[0.16]'
              }`}
            >
              <Keyboard className="h-4 w-4" strokeWidth={1.8} />
            </motion.button>
          )}

          {voiceIn.supported && (
            <motion.button
              type="button"
              onClick={voiceIn.start}
              disabled={isLoading || !!isQuickReply}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              title={voiceIn.isListening ? t.micStop : t.micStart}
              className={`shrink-0 grid place-items-center h-10 w-10 rounded-md border transition-colors ${
                voiceIn.isListening
                  ? 'bg-danger/15 border-danger/40 text-danger'
                  : 'bg-ink-850 border-white/[0.08] text-ink-200 hover:border-white/[0.16]'
              }`}
            >
              {voiceIn.isListening ? (
                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
                  <Mic className="h-4 w-4" strokeWidth={1.8} />
                </motion.span>
              ) : (
                <MicOff className="h-4 w-4" strokeWidth={1.8} />
              )}
            </motion.button>
          )}
        </fieldset>
      </form>
    </div>
  );
};

export default ChatPanel;
