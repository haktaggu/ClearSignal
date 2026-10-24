# ClearSignal

ClearSignal is a conversation-safety assistant. It records a short utterance,
transcribes it with IBM Watson Speech to Text, translates it to Spanish, and
uses watsonx.ai to flag evidence-supported pressure tactics, secrecy requests,
coercion, and possible contradictions.

The app keeps up to 40 transcript messages in local app/browser storage so
later statements can be checked against earlier ones. Use the trash button to
clear this history. It is not stored in a server-side database, but local
storage is unencrypted, so avoid sensitive conversations on shared devices.
Recording currently happens in short start/stop segments rather than
continuous streaming.

## Project structure

- `main.py` — FastAPI backend and audio-analysis endpoint.
- `speech_to_text.py` — IBM Watson Speech to Text integration.
- `analyzer.py` — watsonx.ai translation and safety analysis.
- `ClearSignal-FrontEnd/` — Expo / React Native frontend.

## Prerequisites

- Python 3.10 or newer
- Node.js and npm
- A watsonx.ai project and IBM Watson Speech to Text service credentials

## Backend setup

From the repository root:

```bash
cp .env.example .env
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

Fill in `.env` with your IBM credentials before starting the server. Do not
commit this file.

The backend runs at `http://127.0.0.1:8000`. Open
`http://127.0.0.1:8000/docs` to inspect and test the API.

## Frontend setup

In a second terminal:

```bash
cd ClearSignal-FrontEnd
cp .env.example .env
npm ci
npx expo start --web
```

For browser development on the same Mac, leave the frontend `.env` value as:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/analyze-audio
```

For Expo Go on a physical phone, replace `127.0.0.1` with your Mac's local
Wi-Fi IP address, then restart Expo:

```env
EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:8000/analyze-audio
```

```bash
npx expo start --clear
```

## Demo flow

1. Start the backend and frontend.
2. Tap the microphone, speak, then tap again to stop and analyze the segment.
3. The screen shows the English transcript, Spanish translation, and any
   evidence-supported communication signal.
4. Record a second, contradictory statement to demonstrate conversation-aware
   analysis.

## Environment files

- `.env` files are local configuration and are ignored by Git.
- `.env.example` files are safe templates and should be committed.
- Keep API keys only in the backend `.env`; `EXPO_PUBLIC_*` values are visible
  to the frontend and must not contain secrets.
