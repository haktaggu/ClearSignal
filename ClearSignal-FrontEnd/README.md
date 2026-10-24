# ClearSignal Frontend

This is the Expo / React Native client for ClearSignal. For full backend and
frontend setup, see the repository [README](../README.md).

## Run locally

```bash
cp .env.example .env
npm ci
npx expo start --web
```

The frontend reads its backend address from `.env`:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/analyze-audio
```

If testing through Expo Go on a phone, use your Mac's Wi-Fi IP address instead
of `127.0.0.1`, then restart Expo with `npx expo start --clear`.
