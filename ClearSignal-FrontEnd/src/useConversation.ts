import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import type { Message, Utterance } from './types';

const MAX_MESSAGES = 40;
const HISTORY_STORAGE_KEY = '@clearsignal/conversation-history-v1';

function isStoredMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  const text = candidate.text;
  if (typeof text !== 'object' || text === null) return false;

  const translations = text as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof translations.en === 'string' &&
    typeof translations.es === 'string' &&
    typeof candidate.tone === 'string' &&
    typeof candidate.intensity === 'number' &&
    typeof candidate.why === 'string' &&
    Array.isArray(candidate.signals) &&
    candidate.signals.every((signal) => typeof signal === 'string') &&
    typeof candidate.context === 'string'
  );
}

// Full URL to POST /analyze-audio — set EXPO_PUBLIC_API_URL in
// ClearSignal-FrontEnd/.env (use 127.0.0.1 for browser, LAN IP for iPhone).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/analyze-audio';

// ─── Backend response types ───────────────────────────────────────────────────

interface BackendFinding {
  type: string;
  category: string;
  evidence: string | string[];
  explanation?: string;
  alternative_explanation?: string;
}

interface BackendAnalysis {
  status: string;
  tone: string;
  intensity: number;
  findings: BackendFinding[];
  suggested_question?: string | null;
}

interface BackendResponse {
  transcript: string;
  translation?: string;
  analysis: BackendAnalysis;
}

// ─── display_AI ───────────────────────────────────────────────────────────────
//
// Maps the raw backend JSON into a typed Utterance the UI renders directly.
//
//   data.analysis.tone                       → Utterance.tone
//   data.analysis.intensity                  → Utterance.intensity
//   data.analysis.findings[].explanation     → Utterance.why  (joined)
//   data.analysis.findings[].category        → Utterance.signals[]
//   data.analysis.suggested_question         → Utterance.context
//   data.transcript                          → Utterance.text.en
//   data.translation                         → Utterance.text.es

function display_AI(data: BackendResponse): Utterance {
  const analysis = data.analysis;
  const findings: BackendFinding[] = Array.isArray(analysis?.findings)
    ? analysis.findings
    : [];

  const validTones = new Set<string>([
    'neutral', 'joking', 'sarcasm', 'sly', 'anger', 'contradict',
  ]);
  const tone: Utterance['tone'] = validTones.has(analysis?.tone)
    ? (analysis.tone as Utterance['tone'])
    : 'neutral';

  const intensity =
    typeof analysis?.intensity === 'number' &&
    analysis.intensity >= 0 &&
    analysis.intensity <= 1
      ? analysis.intensity
      : 0.2;

  const why =
    findings.length > 0
      ? findings.map((f) => f.explanation ?? f.category).filter(Boolean).join(' ')
      : 'No warning patterns were detected in this statement.';

  const signals = findings.map((f) => f.category).filter(Boolean);

  const firstEvidence = findings[0]?.evidence;
  const evidenceText = Array.isArray(firstEvidence)
    ? firstEvidence.join('\n')
    : firstEvidence;
  const context = analysis?.suggested_question || evidenceText || '';

  return {
    text: {
      en: data.transcript ?? '',
      es: data.translation ?? data.transcript ?? '',
    },
    tone,
    intensity,
    why,
    signals,
    context,
  };
}

// ─── useConversation ──────────────────────────────────────────────────────────

export function useConversation(active: boolean) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recording = useRef(false);
  const counter = useRef(0);
  const history = useRef<Message[]>([]);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());

  const saveMessages = useCallback((nextMessages: Message[]) => {
    history.current = nextMessages;
    setMessages(nextMessages);

    persistenceQueue.current = persistenceQueue.current
      .catch(() => undefined)
      .then(() =>
        AsyncStorage.setItem(
          HISTORY_STORAGE_KEY,
          JSON.stringify(nextMessages)
        )
      )
      .catch(() => {
        setError('Could not save conversation history on this device.');
      });
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreMessages = async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        if (stored && mounted) {
          const parsed: unknown = JSON.parse(stored);
          const restored = Array.isArray(parsed)
            ? parsed.filter(isStoredMessage).slice(-MAX_MESSAGES)
            : [];

          history.current = restored;
          counter.current = restored.reduce((highest, message) => {
            const match = /^m(\d+)$/.exec(message.id);
            return match ? Math.max(highest, Number(match[1])) : highest;
          }, 0);
          setMessages(restored);
        }
      } catch {
        if (mounted) {
          setError('Could not restore saved conversation history.');
        }
      } finally {
        if (mounted) setHistoryLoaded(true);
      }
    };

    void restoreMessages();
    return () => {
      mounted = false;
    };
  }, []);

  // Keep the current conversation in storage as well as memory.
  const push = useCallback((u: Utterance) => {
    counter.current += 1;
    const message: Message = { ...u, id: `m${counter.current}` };
    saveMessages([...history.current, message].slice(-MAX_MESSAGES));
  }, [saveMessages]);

  // Request microphone permission once on mount.
  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.granted) {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
    })();
  }, []);

  // ── call_AI ─────────────────────────────────────────────────────────────────
  // Sends the recorded audio file to POST /analyze-audio together with the
  // conversation history. IBM STT transcribes it, Watsonx analyzes tone and
  // translates. Calls display_AI() to map the response into a Message.
  const call_AI = useCallback(
    async (uri: string) => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();

        // Pass the last 40 English transcripts as context for contradiction detection.
        formData.append(
          'history',
          JSON.stringify(history.current.map((m) => m.text.en))
        );

        // Attach the audio file — Blob on web, URI object on native.
        if (Platform.OS === 'web') {
          const blob = await fetch(uri).then((r) => r.blob());
          formData.append('file', blob, 'recording.webm');
        } else {
          formData.append('file', {
            uri,
            name: 'recording.m4a',
            type: 'audio/m4a',
          } as unknown as Blob);
        }

        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server error ${response.status}: ${response.statusText}`);
        }

        const data: BackendResponse = await response.json();
        push(display_AI(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error from server');
      } finally {
        setLoading(false);
      }
    },
    [push]
  );

  const startRecording = useCallback(async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
    recording.current = true;
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (!recording.current) return;
    await recorder.stop();
    recording.current = false;
    const uri = recorder.uri;
    if (uri) {
      await call_AI(uri);
    }
  }, [recorder, call_AI]);

  // Toggle recording whenever the active flag changes.
  useEffect(() => {
    if (!historyLoaded) return;

    if (active) {
      void startRecording();
    } else {
      void stopRecording();
    }
  }, [active, historyLoaded, startRecording, stopRecording]);

  const clear = useCallback(() => {
    counter.current = 0;
    setError(null);
    saveMessages([]);
  }, [saveMessages]);

  return { messages, loading, error, historyLoaded, clear };
}
