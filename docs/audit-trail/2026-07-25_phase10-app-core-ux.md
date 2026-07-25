# 2026-07-25 — Phase 10 app core UX (software-only)

## Checklist

- [x] Align cube client types with cube OpenAPI (devices reachable/state, routines, consent, status)
- [x] MockPairingService + MockWifiProvisioner + tests
- [x] Devices / Routines / Profiles / Dashboard / Settings screens
- [x] Pairing + Wi-Fi stack screens
- [x] Coverage ≥90% on `src/`
- [ ] Human: real BLE / secure Wi-Fi hardware transfer

## Summary

Software-only Phase 10 companion UX on the Expo shell: mock pairing and Wi-Fi
provisioning, device dashboard with scenes, routines and profiles UI, and API
client alignment with wisdom-cube Phase 9.

## Deployment Checklist

- [ ] No new env vars
- [ ] Confirm Expo app loads against seeded `demoCubeClient` for demos
- [ ] Hardware pairing/Wi-Fi remain blocked until cube BLE support exists
