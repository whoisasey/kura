# Kura — Claude Code Project Context

## What is Kura

A personal lifestyle and wellness tracking PWA. Core features: cycle phase tracking with hormone-based predictions, daily journaling (mood, energy, sleep, stress, hydration, meals, activities, symptoms), AI-powered recommendations via Claude API, environmental signal monitoring (barometric pressure, AQI, UV index), and a personal recipe/ingredient library with push notifications.

Originally a portfolio piece, now being built for potential public/commercial launch.

---

## Tech Stack

| Layer              | Choice                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, TypeScript)                                           |
| UI                 | Material UI                                                                   |
| Database / Auth    | Supabase (Postgres + RLS)                                                     |
| AI                 | Claude API — `claude-sonnet-4-20250514`                                       |
| Hosting            | Vercel                                                                        |
| Environmental data | Open-Meteo API                                                                |
| Notifications      | Web Push API with VAPID + next-pwa                                            |
| Future mobile      | Capacitor (web → iOS/Android, preserving Next.js codebase)                    |
| Future billing     | RevenueCat                                                                    |
| Future state mgmt  | Zustand                                                                       |
| Future monorepo    | Turborepo (`apps/web`, `apps/mobile`, shared packages: core, api, ui, config) |

---

## Code Style

- **Always use `const` arrow functions** — never `function` declarations
- TypeScript throughout — no `any` unless truly unavoidable, prefer `unknown` for API responses
- App Router conventions: Server Components by default, `"use client"` only when needed
- Supabase client: use server client in Server Components / route handlers, browser client in Client Components

---

## Design System

Two visual modes defined with full MUI design tokens:

- **Light mode:** "Clay" — warm off-whites, earthy neutrals
- **Dark mode:** "Walnut" — deep warm browns, muted contrast

Use MUI's `ThemeProvider` and `useColorScheme`. Never hardcode color hex values — always reference theme tokens.

---

## Database Schema (11 tables, Supabase Postgres)

Key tables:

- `profiles` — user profile, linked to `auth.users`
- `cycle_entries` — period/cycle tracking events
- `journal_entries` — daily log (mood, energy, sleep, stress, hydration)
- `journal_meals` — meal entries linked to journal
- `journal_activities` — activity entries linked to journal
- `journal_symptoms` — symptom entries linked to journal
- `recipes` — personal recipe library
- `ingredients` — ingredient library with auto-tagging
- `recipe_ingredients` — join table
- `push_subscriptions` — VAPID web push subscriptions
- `ai_recommendations` — stored Claude API responses

All tables have RLS policies. Always use typed Supabase queries — never bypass RLS.

---

## Auth

- Email/password primary (magic link available but has OTP expiry friction in local dev)
- Middleware handles session refresh and protected route redirects
- Auth is structured to be compatible with future Capacitor mobile transition

---

## AI Recommendations Layer

- Uses Claude API (`claude-sonnet-4-20250514`) via server-side route handlers only — never expose API key client-side
- Prompts must stay in **wellness framing** — no diagnostic language, no treatment claims, no reproductive health predictions
- This is a deliberate regulatory constraint (Health Canada / FDA / GDPR) to keep Kura out of SaMD (Software as a Medical Device) territory

---

## Key Architectural Decisions

| Decision        | Choice                    | Why                                                    |
| --------------- | ------------------------- | ------------------------------------------------------ |
| Mobile strategy | Capacitor (not Expo)      | Preserves Next.js codebase; Expo required full rewrite |
| CSS framework   | MUI (not Bootstrap SCSS)  | Better TypeScript integration, design token system     |
| PWA vs native   | PWA first                 | Faster to market; Capacitor wraps it later             |
| Monorepo        | Turborepo (planned)       | Web→mobile transition without codebase divergence      |
| Subscriptions   | RevenueCat (planned)      | Unified iOS/Android/web billing                        |
| Data residency  | AWS `ca-central-1` target | PIPEDA (Canadian privacy law) compliance               |

---

## Monetization Model (Planned)

- **Free tier** — acquisition, core tracking
- **Kura Plus** — ~$8/mo or ~$60/yr (advanced AI insights, full history, export)
- **Practitioner tier** — ~$25/mo/seat (wellness coaches, nutritionists)
- **Usage-based API tier** — longer-term, for power users

---

## Regulatory Notes

- Keep AI feature framing in **wellness**, not medical/diagnostic territory
- One-time consult with a Canadian health tech lawyer recommended before public launch
- Upgrade Supabase to Pro plan before onboarding real users (connection pooling, backups, SLA)

---

## Current Build State

- [x] Dependency installation
- [x] MUI theme + ThemeProvider (Clay / Walnut)
- [x] Root layout with PWA manifest
- [x] Supabase client/server setup
- [x] Auth middleware
- [x] Full DB schema with RLS policies
- [x] Login page (email/password + magic link fallback)
- [x] Authenticated app layout with BottomNav
- [x] Dashboard page
- [x] Journal page
- [x] Cycle tracking page (phase header, hormone card, calendar, symptom forecast, exercise card, transition card, log period FAB)
- [x] AI recommendations (cycle insight + predict route handlers, prompt library)
- [x] Environmental signal monitoring (Open-Meteo API integration, EnvBanner + EnvCard components)
- [x] Insights page (recent journal entries, symptom frequency)
- [x] Library page (cycle phase reference guide — menstrual, follicular, ovulatory, luteal)
- [ ] Recipe/ingredient library
- [ ] Push notifications

---

## TypeScript Learning Note

Atina is a freelance web developer (WordPress, Shopify, Next.js). When working in TypeScript:
- Name concepts formally when they come up (e.g. "this is a mapped type", "this is a type guard")
- Add a one-liner explaining *why* it works that way
- Occasionally prompt her to explain the concept back in her own words — she's building fluency in articulating TS fundamentals, not just using them
- Keep prompts low-stakes, like explaining to another dev
Don't do this for every line — just when something worth naming comes up.
