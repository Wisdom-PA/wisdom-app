# What this service does

Mobile companion for the Wisdom on-device home assistant. Configures the cube,
shows privacy/internet transparency, manages profiles, devices, routines, and
backup/restore. Product plan and tickets live in the Wisdom docs workspace
(`Plan.md`, `Tickets.md`, `GettingStarted.md`).

This repo starts as a **TypeScript package** from the company skeleton; the
Expo / React Native app shell is the next layer on top of that baseline.

## Feature map

- package baseline — shared TS utilities and publishable API surface — `src/index.ts`
- _(pending)_ companion UI — Expo RN tabs/stacks, cube API client — TBD
