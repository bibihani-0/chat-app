# Chat & Games App

Real-Time Social Chat & Multiplayer Games platform.

## Stack
- Next.js + TypeScript (frontend + server routes)
- GitHub (source control)
- Vercel (deployment)
- Supabase (database, auth, storage, realtime)

## Phase 01 — Foundation (current)
- Next.js + TypeScript project created
- Supabase client helper added (`lib/supabase/client.ts`)
- Environment variable structure defined (`.env.example`)

## Setup
1. Run `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key
3. Run `npm run dev` and open http://localhost:3000

## Environment Variables
See `.env.example`. Never commit `.env.local` — it is git-ignored.
