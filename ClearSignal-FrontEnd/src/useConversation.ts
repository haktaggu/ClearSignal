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
const API_URL = 'http://127.0.0.1:8000/analyze-audio';

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

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    const findings = data.analysis?.findings ?? [];

    push({
      text: {
        en: data.transcript,
        es: data.transcript,
      },
      tone: findings.length > 0 ? 'sly' : 'neutral',
      intensity: findings.length > 0 ? 0.85 : 0.2,
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

  const clear = useCallback(() => {
    history.current = [];
    counter.current = 0;
    setMessages([]);
  }, []);

  return {
    messages,
    clear,
  };
}