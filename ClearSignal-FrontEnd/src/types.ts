export type LangCode = 'en' | 'es';

export type ToneId = 'neutral' | 'joking' | 'sarcasm' | 'sly' | 'anger' | 'contradict';

export interface Tone {
  id: ToneId;
  label: string;
  emoji: string;
  color: string;
  meaning: string;
}

/** What a tone-analysis backend returns for one spoken line. */
export interface Utterance {
  text: Record<LangCode, string>;
  tone: ToneId;
  /** 0 to 1 */
  intensity: number;
  why: string;
  signals: string[];
  context: string;
  /** For 'walkback': how many utterances earlier the reverted point was said. */
  refersBack?: number;
}

export interface Message {
  id: string;
  text: Record<LangCode, string>;
  tone: ToneId;
  intensity: number;
  why: string;
  signals: string[];
  context: string;
  /** Id of the earlier message this one reverts. */
  refersToId?: string;
}
