import type { LangCode, Tone, ToneId } from './types';

export const colors = {
  bg: '#000000',
  card: '#0C0C0E',
  text: '#F4F4F5',
  muted: '#8A8A92',
  faint: '#3C3C42',
  hairline: 'rgba(255,255,255,0.14)',
  accent: '#A8C7FA',
};

export const LANGUAGES: Record<LangCode, { name: string }> = {
  en: { name: 'English' },
  es: { name: 'Spanish' },
};

export const TONES: Tone[] = [
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#A1A1AA', meaning: 'No specific warning pattern found' },
  { id: 'sly', label: 'Pressure / secrecy', emoji: '😏', color: '#A78BFA', meaning: 'Explicit pressure, urgency, or secrecy cues' },
  { id: 'anger', label: 'Threat / coercion', emoji: '⚠️', color: '#F05252', meaning: 'Explicitly threatening or coercive wording' },
  { id: 'contradict', label: 'Possible conflict', emoji: '❗', color: '#ff0000', meaning: 'Two factual statements may conflict' },
];

export const TONE_MAP = Object.fromEntries(TONES.map((t) => [t.id, t])) as Record<ToneId, Tone>;
