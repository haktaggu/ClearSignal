import type { Utterance } from './types';

// Mock conversation standing in for a real speech + tone backend.
export const SAMPLES: Utterance[] = [
  {
    text: {
      en: "The meeting got moved to three o'clock.",
      es: 'La reunión se movió a las tres.',
    },
    tone: 'neutral',
    intensity: 0.5,
    why: 'Even pitch and a steady pace with no stress on any single word. It reads as a plain statement of fact.',
    signals: ['Even pitch', 'Steady pace', 'No emphasis'],
    context: 'Nothing hidden here. Safe to take at face value.',
  },
  {
    text: {
      en: "Don't worry, I only burned the kitchen a little.",
      es: 'No te preocupes, solo quemé la cocina un poquito.',
    },
    tone: 'joking',
    intensity: 0.8,
    why: 'A bouncy rhythm and a smile in the voice, with the punchline landing on the last words. The exaggeration is the cue.',
    signals: ['Bouncy rhythm', 'Smiling voice', 'Exaggeration'],
    context: 'Likely light teasing. The literal translation sounds more alarming than intended.',
  },
  {
    text: {
      en: 'Great, another meeting. Just what I needed.',
      es: 'Genial, otra reunión. Justo lo que necesitaba.',
    },
    tone: 'sarcasm',
    intensity: 0.75,
    why: 'Positive words delivered flat and drawn out. The wording says "great" but the delivery says the opposite.',
    signals: ['Flat delivery', 'Drawn-out vowels', 'Positive words, negative contour'],
    context: 'Translate the meaning, not the words. A literal version would sound sincere and miss the point.',
  },
  {
    text: {
      en: 'I might know where the last cookie went.',
      es: 'Quizás sé adónde fue la última galleta.',
    },
    tone: 'sly',
    intensity: 0.65,
    why: 'Lower volume, a short pause before the key phrase, and a knowing lilt. It suggests they know more than they are saying.',
    signals: ['Lowered volume', 'Pause before key phrase', 'Knowing lilt'],
    context: 'Probably playful hinting rather than a real secret. A follow-up question would likely get a smile.',
  },
  {
    text: {
      en: 'The deadline is Friday. I told you twice!',
      es: '¡La fecha límite es el viernes! ¡Te lo dije dos veces!',
    },
    tone: 'anger',
    intensity: 0.9,
    why: 'Volume and pace rose together with hard stress on "twice", and the pauses nearly disappeared. Typical of frustration building.',
    signals: ['Rising volume', 'Hard stress', 'Clipped endings'],
    context: 'This reads as frustration about the deadline, not about you personally. A calm, direct reply usually helps.',
  },
  {
    text: {
      en: "Okay, maybe I overreacted. Friday isn't set in stone.",
      es: 'Vale, quizá exageré. El viernes no es definitivo.',
    },
    tone: 'contradict',
    intensity: 0.7,
    why: 'Pitch softened and the pace slowed while revisiting the deadline from earlier, withdrawing the firm stance.',
    signals: ['Softer pitch', 'Slower pace', 'Hedging with "maybe"'],
    context: 'They are backing off the earlier point. Good moment to confirm the new timing.',
    refersBack: 1,
  },
];
