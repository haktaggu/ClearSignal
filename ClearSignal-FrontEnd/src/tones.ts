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
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#A1A1AA', meaning: 'Plain, matter-of-fact' },
  { id: 'joking', label: 'Joking', emoji: '😄', color: '#F472B6', meaning: 'Teasing, lighthearted' },
  { id: 'sarcasm', label: 'Sarcasm', emoji: '🙄', color: '#2DD4BF', meaning: 'Means the opposite' },
  { id: 'sly', label: 'Sly', emoji: '😏', color: '#A78BFA', meaning: 'Hinting, knowing more' },
  { id: 'anger', label: 'Anger', emoji: '😠', color: '#F05252', meaning: 'Frustrated, heated' },
  { id: 'walkback', label: 'Walked back', emoji: '↩️', color: '#F5B461', meaning: 'Reverted an earlier point' },
];

export const TONE_MAP = Object.fromEntries(TONES.map((t) => [t.id, t])) as Record<ToneId, Tone>;
