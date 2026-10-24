import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import type { Message, Utterance } from './types';

const MAX_MESSAGES = 40;

// Full URL to POST /analyze-audio — set EXPO_PUBLIC_API_URL in
// ClearSignal-FrontEnd/.env (use 127.0.0.1 for browser, LAN IP for iPhone).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/analyze-audio';

// ─── Backend response types ───────────────────────────────────────────────────

interface BackendFinding {
  type: string;
  category: string;
  evidence: string;
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

  const context = analysis?.suggested_question || findings[0]?.evidence || '';

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

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recording = useRef(false);
  const counter = useRef(0);
  const history = useRef<Message[]>([]);

  // push — converts an Utterance into a Message with a stable id.
  const push = useCallback((u: Utterance) => {
    counter.current += 1;
    const message: Message = { ...u, id: `m${counter.current}` };
    history.current = [...history.current, message].slice(-MAX_MESSAGES);
    setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES));
  }, []);

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
    if (active) {
      void startRecording();
    } else {
      void stopRecording();
    }
  }, [active, startRecording, stopRecording]);

  const clear = useCallback(() => {
    history.current = [];
    counter.current = 0;
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, clear };
}
