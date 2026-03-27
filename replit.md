# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the **Universe Moon [Um]** full-stack web app — a WhatsApp group community platform.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (port 8080)
- **Frontend**: React + Vite + TailwindCSS + Framer Motion (port 26156)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **File uploads**: Multer (stored in `/uploads`, served statically)
- **Build**: esbuild (API), Vite (frontend)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/           # Express API server (port 8080)
│   └── universe-moon/        # React frontend (port 26156)
│       └── src/
│           ├── pages/        # All page components
│           ├── components/   # Layout, Theme/DynamicSky, UI
│           └── hooks/        # useAuthStore, use-toast
├── lib/
│   ├── api-spec/             # OpenAPI spec + Orval codegen
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas
│   └── db/                   # Drizzle ORM schema + DB connection
├── scripts/                  # Utility scripts
└── pnpm-workspace.yaml
```

## Universe Moon — Feature Map

### Auth
- Token: `ADMIN UM SECRET` → admin role
- Token: `MEMBER UM 2026` → member role
- Guest mode (read-only)
- Auth stored in Zustand (useAuthStore)

### Pages & Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Time-based greeting, stats, quick links, admin events |
| `/members` | Members | Member list grouped by role, avatar upload, kick |
| `/ex-members` | ExMembers | Kicked/inactive members |
| `/gallery` | Gallery | Masonry photo gallery, file upload, lightbox |
| `/chat` | Chat | WhatsApp-like bubbles, reactions, stickers, DMs, replies |
| `/ngl` | NGL | Anonymous messages with reactions + comments |
| `/memories` | Memories | Timeline of memories |
| `/links` | Links | Saved links |
| `/music` | Music | YouTube embed + audio file player |
| `/vault` | Vault | PIN-protected (UM2025), admin-only content |
| `/opmem` | OpMem | Open member drives with accepted list (TikTok info) |
| `/mep` | Mep | MEP collection with participants + video player |
| `/games` | Games | Game lobby hub |
| `/games/imposter` | ImposterGame | Full room system, 15 categories × 50 words |
| `/games/werewolf` | WerewolfGame | Night/day phases, special roles |
| `/games/dracula` | DraculaGame | Dracula theme |
| `/games/ludo` | LudoGame | Board visualization, dice, token movement |
| `/leaderboard` | Leaderboard | Per-game leaderboards + XP system |
| `/about` | About | About page |

### API Routes (all prefixed `/api`)
- `/auth` — login, logout, me
- `/members` — CRUD + PATCH + kick
- `/chat` — messages, reactions, stickers, DMs
- `/ngl` — anonymous messages + reactions + comments
- `/photos` — gallery CRUD
- `/memories` — timeline CRUD
- `/links` — links CRUD
- `/music` — music CRUD
- `/vault` — secrets (admin-only)
- `/opmem` — open member drives + accepted members
- `/mep` — MEP + participants
- `/games` — room system, game state, dice, moves
- `/leaderboard` — per-game leaderboards
- `/events` — admin event broadcast (rain, fireworks, etc.)
- `/upload` — file upload (photos, videos, audio, avatars)

### Database Tables (Drizzle / PostgreSQL)
- `um_members` — members with specialty, avatarUrl, kickReason
- `um_photos` — gallery photos
- `um_memories` — memories
- `um_links` — links
- `um_music` — music tracks
- `um_secrets` — vault secrets
- `um_opmem` — open member drives
- `um_mep` — MEP videos
- `um_chat_messages` — chat with reactions/stickers/replies
- `um_chat_dms` — private DMs
- `um_stickers` — sticker library
- `um_ngl_messages` — NGL anonymous messages
- `um_ngl_comments` — comments on NGL
- `um_game_rooms` — game room state (JSON)
- `um_game_leaderboard` — game leaderboard
- `um_admin_events` — admin-triggered visual events

### Dynamic UI
- `DynamicSky.tsx` — animated starfield + particle system
  - Exports `useTimePhase()` hook: `{ phase, icon }` (dawn/day/night)
  - Polls `/api/events` every 10s for admin events
  - Renders: rain, coin rain, fireworks, confetti, meteor, stars, snow, hearts, moon rise, galaxy blast
- Time-based greeting in Home page via `useTimePhase()`

### Admin Features
- Trigger 10 event types (visual effects for all members)
- Add/kick/delete members + upload avatars
- Moderate NGL, Chat, Gallery
- Manage OpMem accepted lists
- Admin-only vault content

### Vault
- Client-side PIN: `UM2025`
- Reveals hidden content when correct PIN entered

## Important Developer Notes

- Frontend uses `fetch('/api/...')` directly (not generated hooks) for all new features
- File uploads stored at `/uploads/` (served as static from API server)
- NGL GET includes comments aggregated per message
- Members POST: `nickname` auto-defaults to `name` if not provided
- Members PATCH: partial update for avatar, role, etc.
- OpMem accept: `POST /api/opmem/:id/accepted`, delete: `DELETE /api/opmem/:id/accepted/:idx`
- Game rooms: full JSON state stored in `um_game_rooms` table

## Key Constants
- Founded: 27/11/2025
- Founder: iyuyun
- Admin token: `ADMIN UM SECRET`
- Member token: `MEMBER UM 2026`
- Vault PIN: `UM2025`
