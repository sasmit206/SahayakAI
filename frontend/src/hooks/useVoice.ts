import { useState, useRef, useCallback, useEffect } from 'react';
import { Language } from '../i18n/translations';

// Browser-native Web Speech API — free, no API key, no backend, no expiry.
// Chrome/Edge/Safari support it; we feature-detect and degrade gracefully.

const RECOGNITION_LANG: Record<Language, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
const SYNTH_LANG: Record<Language, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };

function getRecognitionCtor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isVoiceInputSupported(): boolean {
  return typeof window !== 'undefined' && !!getRecognitionCtor();
}

export function isVoiceOutputSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

interface UseVoiceOptions {
  language: Language;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceInput({ language, onResult, onError }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onError?.('unsupported');
      return;
    }
    if (isListening) {
      stop();
      return;
    }

    const recognition = new Ctor();
    recognition.lang = RECOGNITION_LANG[language];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      onError?.(e.error === 'not-allowed' || e.error === 'permission-denied' ? 'denied' : e.error);
    };
    recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) onResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, isListening, onResult, onError, stop]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { isListening, start, stop, supported: isVoiceInputSupported() };
}

export function useVoiceOutput() {
  const [enabled, setEnabled] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // speak() takes an id so the UI can show which specific message is playing —
  // used both for auto-speak-on-new-reply and the per-message play button.
  const speak = useCallback((id: string, text: string, language: Language) => {
    if (!isVoiceOutputSupported() || !text) return;
    window.speechSynthesis.cancel(); // don't stack queued utterances
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SYNTH_LANG[language];
    utter.rate = 1;
    utter.onstart = () => setSpeakingId(id);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, [stopSpeaking]);

  return { enabled, speakingId, speak, stopSpeaking, toggle, supported: isVoiceOutputSupported() };
}
