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
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function useConversation(active: boolean) {
  const [messages, setMessages] = useState<Message[]>([]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recording = useRef(false);
  const counter = useRef(0);
  const history = useRef<Message[]>([]);

  const push = useCallback((u: Utterance) => {
    counter.current += 1;

    const message: Message = {
      ...u,
      id: `m${counter.current}`,
    };

    history.current = [...history.current, message].slice(-MAX_MESSAGES);
    setMessages((previous) => [...previous, message].slice(-MAX_MESSAGES));
  }, []);

  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();

      if (permission.granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }
    })();
  }, []);

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
    if (!uri) return;

    const formData = new FormData();
    formData.append(
      'history',
      JSON.stringify(history.current.map((message) => message.text.en))
    );

    if (Platform.OS === 'web') {
      const audioBlob = await fetch(uri).then((response) => response.blob());
      formData.append('file', audioBlob, 'recording.webm');
    } else {
      formData.append('file', {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);
    }

    if (!API_URL) {
      throw new Error('EXPO_PUBLIC_API_URL is not configured.');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Audio analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const findings = data.analysis?.findings ?? [];

    push({
      text: {
        en: data.transcript,
        es: data.translation ?? data.transcript,
      },
      tone: data.analysis?.tone ?? 'neutral',
      intensity: data.analysis?.intensity ?? 0.2,
      why: findings
        .map((finding: any) => finding.explanation)
        .join(' '),
      signals: findings.map((finding: any) => finding.category),
      context: data.analysis?.suggested_question ?? '',
    });
  }, [recorder, push]);

  useEffect(() => {
    if (active) {
      void startRecording();
    } else {
      void stopRecording();
    }
  }, [active, startRecording, stopRecording]);

  return {
    messages,
  };
}
