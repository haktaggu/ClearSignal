import type { Utterance } from './types';

// Mock examples use the same evidence-based tone values as the backend.
export const SAMPLES: Utterance[] = [
  {
    text: {
      en: 'There are no additional fees.',
      es: 'No hay tarifas adicionales.',
    },
    tone: 'neutral',
    intensity: 0.5,
    why: 'This is a plain factual statement. It does not by itself establish anything about the speaker’s intent.',
    signals: [],
    context: '',
  },
  {
    text: {
      en: 'Keep this between us. Do not ask anyone else.',
      es: 'Mantén esto entre nosotros. No le preguntes a nadie más.',
    },
    tone: 'sly',
    intensity: 0.65,
    why: 'The statement explicitly asks for secrecy and discourages checking with others.',
    signals: ['Secrecy request', 'Restricted communication'],
    context: 'There may be a practical explanation. Ask why the request needs to be kept private.',
  },
  {
    text: {
      en: 'If you leave before finishing, I will not pay you.',
      es: 'Si te vas antes de terminar, no te pagaré.',
    },
    tone: 'anger',
    intensity: 0.9,
    why: 'The statement makes payment conditional on staying to finish the work.',
    signals: ['Coercive condition'],
    context: 'Ask for the payment terms in writing before deciding how to proceed.',
  },
  {
    text: {
      en: 'Actually, there is a $200 processing fee.',
      es: 'En realidad, hay una tarifa de procesamiento de $200.',
    },
    tone: 'contradict',
    intensity: 0.7,
    why: 'This conflicts with the earlier statement that there are no additional fees.',
    signals: ['Fee inconsistency'],
    context: 'Ask whether the processing fee is new or was excluded from the earlier statement.',
    refersBack: 3,
  },
];
