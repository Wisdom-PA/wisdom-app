# 2026-07-25 — Phase 13.1 optional text chat client (software)

## Checklist

- [x] Align `ChatMessage` / `ChatResponse` with cube (`allowInternet`, `usedInternet`, `privacyMode`)
- [x] Pure chat helpers + Vitest (build message, source labels, thread append)
- [x] MockCubeClient.chat respects allowInternet / offline mode
- [x] Chat stack screen; entry from Dashboard + Settings
- [x] Document F9.T10.S2 mic/speaker satellite as human-blocked / deferred
- [ ] Human: phone mic/speaker satellite client (F9.T10.S2)
- [ ] Human: real BLE / hardware path

## Summary

Software-only text chat UI against `demoCubeClient.chat`. The app forwards
`allowInternet` and displays cube-reported on-device vs online + privacy mode.
No mic/speaker satellite in this slice.

## Deployment Checklist

- [ ] No new env vars
- [ ] Confirm Expo Chat screen against mock client
- [ ] Cube `POST /chat` already exposes matching response fields
