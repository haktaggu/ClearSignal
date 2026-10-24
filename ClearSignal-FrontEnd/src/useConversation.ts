import { useCallback, useEffect, useRef, useState } from 'react';
import { SAMPLES } from './samples';
import type { Message, Utterance } from './types';

const MAX_MESSAGES = 40;

/**
 * Emits translated, tone-tagged messages while `active` is true.
 *
 * This is a stand-in for a real pipeline. To go live, replace the interval with:
 *   mic audio -> speech recognition + translation + tone model -> Utterance
 * and call `push(utterance)` for each result. The UI needs nothing else.
 */
export function useConversation(active: boolean) {
  const [messages, setMessages] = useState<Message[]>([]);
  const cursor = useRef(0);
  const counter = useRef(0);
  const history = useRef<Message[]>([]);

  const push = useCallback((u: Utterance) => {
    counter.current += 1;
    const { refersBack, ...rest } = u;
    const refersToId = refersBack
      ? history.current[history.current.length - refersBack]?.id
      : undefined;
    const message: Message = { ...rest, id: `m${counter.current}`, refersToId };
    history.current = [...history.current, message].slice(-MAX_MESSAGES);
    setMessages((prev) => [...prev, message].slice(-MAX_MESSAGES));
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const tick = () => {
      push(SAMPLES[cursor.current % SAMPLES.length]);
      cursor.current += 1;
    };
    const first = setTimeout(tick, 1200);
    const loop = setInterval(tick, 3600);
    return () => {
      clearTimeout(first);
      clearInterval(loop);
    };
  }, [active, push]);

  const clear = useCallback(() => {
    history.current = [];
    cursor.current = 0;
    setMessages([]);
  }, []);

  return { messages, push, clear };
}
