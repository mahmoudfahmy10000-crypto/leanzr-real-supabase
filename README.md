# Leanzr Real Supabase

This is a real backend-connected version of Leanzr.

## What is real here
- Real email/password authentication via Supabase
- Real project storage in database
- Real project outputs storage in database
- Real refresh persistence
- Real user profiles and roles

## Setup

1. Create a Supabase project
2. In Supabase SQL Editor, run:
   - `supabase/schema.sql`
3. Copy `.env.example` to `.env`
4. Put your Supabase values in `.env`

## Run

```bash
npm install
npm run dev
```

Open the local link shown by Vite.

## Main pages
- Overview
- Tool Library
- Projects
- Reports
- Department Centers
- Lean Six Sigma Center
- Settings

## Notes
This is focused on real backend usage first.
It is simpler than the huge UI-only versions, but it truly stores data in the backend.
