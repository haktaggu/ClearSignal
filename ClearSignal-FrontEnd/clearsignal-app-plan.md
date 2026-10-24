# ClearSignal Front-End Plan (Revised — Partner UI Integrated)

## Top-Level Overview

The partner (`feat-sameer` branch) has delivered a **complete, polished UI shell**. The entire visual design, component hierarchy, animations, and screen flow already exist and need no changes. The only remaining work is replacing the mock data layer with a real speech-to-text + Watsonx.AI pipeline.

### What already exists (DO NOT modify)
| File | Role |
|---|---|
| `App.tsx` | Root: switches between `LegendScreen` and `TranslatorScreen` |
| `src/LegendScreen.tsx` | Animated intro showing the tone color legend |
| `src/TranslatorScreen.tsx` | Main screen: language bar, message list, mic button, tone toggle |
| `src/MessageCard.tsx` | Per-message card: source text, translation, animated tone bar |
| `src/ToneBar.tsx` | Frosted glass pill with animated intensity fill |
| `src/TonePill.tsx` | Legend chip: dot + emoji + label |
| `src/ToneSheet.tsx` | Swipe-up bottom sheet with tone reasoning detail |
| `src/Reveal.tsx` | Smooth expand/collapse animation wrapper |
| `src/Glass.tsx` | Frosted glass surface (BlurView + LinearGradient) |
| `src/tones.ts` | Tone definitions, colors, LANGUAGES record |
| `src/types.ts` | All TypeScript types (`Message`, `Utterance`, `Tone`, etc.) |
| `src/haptics.ts` | Safe haptic feedback wrapper |
| `src/samples.ts` | **MOCK DATA — to be kept for fallback/dev only** |

### What needs to be built
| File | Role |
|---|---|
| `src/useConversation.ts` | **REPLACE stub** with real mic → speech → Watsonx pipeline |
| `src/services/api.ts` | NEW — HTTP client for backend `POST /analyze` + `POST /translate` |
| `src/hooks/use-voice.ts` | NEW — `@react-native-voice/voice` wrapper |
| `src/hooks/use-history.ts` | NEW — AsyncStorage conversation history |
| `src/tones.ts` | **EXTEND** — add the missing tones from original spec (Joy, Control, Joking) and expand `LANGUAGES` to all 6 target languages |
| `src/types.ts` | **EXTEND** — add new `ToneId` values and `LangCode` values to match |

---

## Current vs Target Data Flow

### Current (mock)
```
useConversation(active) → interval timer → SAMPLES[cursor] → messages[]
```

### Target (live)
```
useVoice() → transcript string
    ↓
api.analyzeText(transcript) → POST /analyze → ToneResult { tones: {[id]: 0-1} }
    ↓
dominant tone + intensity extracted → Utterance built
    ↓
api.translateText(transcript, targetLang) → POST /translate → string
    ↓
message pushed into useConversation messages[]
    ↓
useHistory saves entry to AsyncStorage
```

---

## Tone Palette

Partner's 6 tones are kept **exactly as defined** — no additions or changes to colors, emojis, or labels.

| ToneId | Label | Emoji | Color |
|---|---|---|---|
| `neutral` | Neutral | 😐 | `#A1A1AA` |
| `joking` | Joking | 😄 | `#F472B6` |
| `sarcasm` | Sarcasm | 🙄 | `#2DD4BF` |
| `sly` | Sly | 😏 | `#A78BFA` |
| `anger` | Anger | 😠 | `#F05252` |
| `contradict` | Walked back | ❗ | `#FF9B3E` |

`neutral` covers the "no strong tone" case — the backend should return it when no tone is detected. The Watsonx response will be mapped to one of these 6 + neutral.

---

## Languages

### Current (partner)
`en` and `es` only.

### Target
| Code | Name |
|---|---|
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `zh` | Mandarin |
| `ja` | Japanese |
| `ar` | Arabic |

`TranslatorScreen` already has a language swap button. The `langs.to` value will drive the `POST /translate` call. A language picker modal needs to be added to let the user select `langs.to` from the full list.

---

## Sub-Tasks

---

### Sub-Task 1 — Extend Languages + Fix Compile Error

**Intent**
Add the 5 additional target languages to `types.ts` and `tones.ts`, and fix the one known compile error in `ToneSheet.tsx`. Tone definitions themselves are untouched.

**Expected Outcomes**
- `LangCode` union includes `fr`, `de`, `zh`, `ja`, `ar` in addition to existing `en` and `es`.
- `LANGUAGES` record in `tones.ts` includes all 7 languages.
- `TONE_MAP` and `TONES` array are **not changed**.
- `ToneSheet.tsx` compile error (`TONE_MAP.walkback`) is fixed to `TONE_MAP.contradict`.
- All existing components compile without changes.

**Todo List**
1. In `src/types.ts`: add `'fr' | 'de' | 'zh' | 'ja' | 'ar'` to the `LangCode` union.
2. In `src/tones.ts`: add French, German, Mandarin, Japanese, Arabic entries to `LANGUAGES` record.
3. In `src/ToneSheet.tsx`: fix `TONE_MAP.walkback` → `TONE_MAP.contradict`.

**Relevant Context**
- `src/types.ts` — `LangCode` type
- `src/tones.ts` — `LANGUAGES` record
- `src/ToneSheet.tsx` — broken reference to `TONE_MAP.walkback`

**Status:** `[ ] pending`

---

### Sub-Task 2 — API Service Layer + Environment Config

**Intent**
Create the HTTP client that calls the backend and the `.env` file pointing to `localhost:3000`.

**⚠️ Actual backend response shape (from `analyzer.py`):**
`POST /analyze` returns:
```json
{
  "transcript": "...",
  "findings": [
    { "type": "warning_sign", "category": "Urgency pressure", "evidence": "right now" },
    { "type": "possible_contradiction", "category": "Fee inconsistency", "evidence": "...", "explanation": "..." }
  ],
  "status": "review_suggested" | "no_pattern_detected"
}
```
`POST /translate` does **not exist yet** — the backend team must add it. Until then, the front end will display the source text as the translation (graceful fallback).

**Expected Outcomes**
- `src/services/api.ts` exports `analyzeText` and `translateText` with typed responses matching the real shapes above.
- `.env` at `ClearSignal-FrontEnd/.env` with `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`.
- `.gitignore` covers `.env`.

**Todo List**
1. Create `src/services/api.ts`:
   - `analyzeText(text, history): Promise<AnalyzeResult>` — `POST /analyze` with `{ text, history: string[] }`.
     - `AnalyzeResult` interface: `{ transcript: string, findings: Finding[], status: string }`.
     - `Finding` interface: `{ type: string, category: string, evidence: string, explanation?: string }`.
   - `translateText(text, targetLang): Promise<string>` — `POST /translate` with `{ text, targetLang }`, returns `{ translation: string }`. Falls back to returning `text` if endpoint is unavailable (404/network error).
   - Base URL from `process.env.EXPO_PUBLIC_API_BASE_URL`.
2. Create `ClearSignal-FrontEnd/.env` with `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`.
3. Confirm `.gitignore` covers `.env` (it already lists `.env` — verify).

**Relevant Context**
- `analyzer.py` — real response shape
- `main.py` — only `POST /analyze` exists today; `POST /translate` is pending from backend team
- No existing API client in the project.

**Status:** `[ ] pending`

---

### Sub-Task 3 — Voice Hook

**Intent**
Wrap `@react-native-voice/voice` into a React hook that the conversation hook can call.

**Expected Outcomes**
- `src/hooks/use-voice.ts` exposes `{ transcript, isListening, startListening, stopListening, resetTranscript }`.
- iOS/Android microphone permission requested on first use.
- Web platform returns a no-op stub (so the app doesn't crash on web).
- Listeners cleaned up on unmount.

**Todo List**
1. Install `@react-native-voice/voice` via `npx expo install @react-native-voice/voice`.
2. Create `src/hooks/use-voice.ts` with the interface above.
3. Add plugin config to `app.json` for microphone permissions (iOS `NSMicrophoneUsageDescription`, Android `RECORD_AUDIO`).

**Relevant Context**
- `AGENTS.md` specifies `npx expo install` for all package installs.
- `App.tsx` entry point — no layout system wrapping; hooks used directly in screen components.

**Status:** `[ ] pending`

---

### Sub-Task 4 — Replace `useConversation` with Live Pipeline

**Intent**
Replace the mock timer in `useConversation.ts` with the real speech → analyze → translate pipeline. This is the central integration point. The UI (`TranslatorScreen`, `MessageCard`, etc.) requires no changes — it consumes `messages[]` the same way.

**The exact function to implement — step by step:**

```
1. mic ON  → useVoice.startListening()
2. speech ends → transcript (string) arrives from device
3.             → POST /analyze { text: transcript, history: pastTranscripts[] }
4.             → findings[] arrives from backend
5.             → pick dominant ToneId from findings:
                   'possible_contradiction' found  →  'contradict'
                   'Urgency pressure' found        →  'anger'
                   'Secrecy pressure' found        →  'sly'
                   'Restricted communication'      →  'anger'
                   no findings                     →  'neutral'
6.             → intensity = findings.length > 0 ? 0.8 : 0.3
7.             → POST /translate { text: transcript, targetLang }
                  (falls back to transcript if endpoint unavailable)
8.             → build Utterance:
                   {
                     text:      { [fromLang]: transcript, [toLang]: translation },
                     tone:      pickedToneId,
                     intensity: intensity,
                     why:       findings[0]?.explanation ?? 'No patterns detected.',
                     signals:   findings.map(f => f.category),
                     context:   findings[0]?.evidence ?? '',
                   }
9.             → push(utterance)  ← existing push() handles id + refersToId + state
10. mic OFF → useVoice.stopListening()
```

**Expected Outcomes**
- When `active=true`: `useVoice` starts listening; each completed transcript fires `analyzeText` then `translateText`; a `Message` is built and pushed.
- When `active=false`: voice recognition stops.
- `messages[]` array populates exactly as before — same shape, same `push`/`clear` API.
- `samples.ts` kept intact but no longer used in production flow.
- `loading` and `error` states exposed so `TranslatorScreen` can show feedback.

**Todo List**
1. Rewrite `src/useConversation.ts`:
   - Accept `active: boolean` and `targetLang: LangCode` parameters.
   - Call `useVoice` internally; on transcript completion run the 10-step pipeline above.
   - Keep a `pastTranscripts` ref (string[]) and pass it to `analyzeText` as `history`.
   - Expose `{ messages, push, clear, loading, error }`.
2. Update `TranslatorScreen.tsx` to pass `langs.to` into `useConversation` and show a small loading indicator while `loading=true`.

**Relevant Context**
- `src/useConversation.ts` — current stub to replace (lines 14–52)
- `src/TranslatorScreen.tsx` — consumer; `langs.to` state already at line 20
- `src/services/api.ts` (Sub-Task 2) — `analyzeText`, `translateText`, `Finding` type
- `src/hooks/use-voice.ts` (Sub-Task 3) — `transcript`, `startListening`, `stopListening`
- `src/types.ts` — `Message`, `Utterance`, `LangCode` shapes

**Status:** `[ ] pending`

---

### Sub-Task 5 — Language Picker Modal

**Intent**
Add a language picker so the user can change `langs.to` in `TranslatorScreen` beyond the current English↔Spanish swap. The partner's swap button stays; the picker adds a long-press or dedicated tap target on the destination language pill.

**Expected Outcomes**
- Tapping the destination language pill opens a modal listing all 7 languages.
- Selecting one updates `langs.to` and closes the modal.
- The component uses the existing `Glass` surface and matches the partner's dark aesthetic.

**Todo List**
1. Create `src/components/LanguagePicker.tsx` — `Modal` + `FlatList` of `LANGUAGES` entries, each row using `Glass`.
2. In `TranslatorScreen.tsx`: make the `to` language pill a `Pressable` that opens the picker; pass `langs.to` and `setLangs` setter.

**Relevant Context**
- `src/TranslatorScreen.tsx` — `langs` state, language bar layout (lines ~21, ~83–99)
- `src/tones.ts` — `LANGUAGES` record (expanded in Sub-Task 1)
- `src/Glass.tsx` — use for row backgrounds

**Status:** `[ ] pending`

---

### Sub-Task 6 — Conversation History (AsyncStorage)

**Intent**
Persist each completed conversation session to AsyncStorage so past sessions can be reviewed.

**Expected Outcomes**
- `src/hooks/use-history.ts` exposes `{ history, saveEntry, clearHistory }`.
- Each `Message` pushed in `useConversation` is auto-saved.
- A minimal `HistoryDrawer` component (slide-up modal, compact rows: timestamp + dominant tone chip) is accessible from a header icon in `TranslatorScreen`.

**Todo List**
1. Install `@react-native-async-storage/async-storage` via `npx expo install`.
2. Create `src/hooks/use-history.ts` reading/writing JSON under key `clearsignal_history`.
3. Create `src/components/HistoryDrawer.tsx` — `Modal` with `FlatList` of past entries (timestamp + `TonePill` for dominant tone).
4. In `useConversation.ts`: call `saveEntry` after each message push.
5. In `TranslatorScreen.tsx`: add a history icon button in the header that opens `HistoryDrawer`.

**Relevant Context**
- `src/hooks/use-history.ts` — new file
- `src/TranslatorScreen.tsx` — header area (`styles.header`, help button already there)
- `src/TonePill.tsx` — reuse for compact tone display in history rows
- `src/Glass.tsx` — use for row backgrounds

**Status:** `[ ] pending`

---

## Implementation Order

```
Sub-Task 1 → Sub-Task 2 → Sub-Task 3 → Sub-Task 4 → Sub-Task 5 → Sub-Task 6
  (types)      (API)        (voice)     (pipeline)    (lang picker) (history)
```

Sub-Tasks 2 and 3 have no dependency on each other and can be done in parallel if desired.

## Key Constraints

- **Never modify** the visual components (`Glass`, `ToneBar`, `TonePill`, `ToneSheet`, `MessageCard`, `Reveal`, `LegendScreen`) — they are the partner's complete design.
- **`TranslatorScreen.tsx`** may receive minimal additions (loading indicator, history button, lang picker trigger) but its layout must not change.
- All new files go in `src/services/` or `src/hooks/` or `src/components/` — no new top-level files.
- Use `npx expo install` for all package installs (per `AGENTS.md`).
- The Watsonx API key lives on the backend only — the front end only knows the base URL.
