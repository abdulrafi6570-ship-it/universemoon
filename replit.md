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
│       └── src/schema/
│           ├── users.ts       # usersTable, sessionsTable
│           ├── members.ts     # membersTable
│           ├── chat.ts        # chatMessagesTable, nglMessagesTable
│           └── content.ts     # ALL other tables (photos, games, events, polls, etc.)
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
| `/memories` | Memories | Timeline of memories with file upload |
| `/links` | Links | Saved links |
| `/music` | Music | YouTube embed + audio file player |
| `/vault` | Vault | PIN-protected (UM2025), admin-only content |
| `/opmem` | OpMem | Open member drives with accepted list (TikTok info) |
| `/mep` | Mep | MEP collection with participants + video player |
| `/games` | Games | Game lobby hub |
| `/games/imposter` | ImposterGame | 20 unique roles, 15 categories × 50 words |
| `/games/werewolf` | WerewolfGame | Night/day phases, special roles |
| `/games/dracula` | DraculaGame | Dracula theme |
| `/games/ludo` | LudoGame | Board visualization, dice, token movement |
| `/leaderboard` | Leaderboard | XP activity tab + Per-game wins tab |
| `/voting` | Voting | Community polls with options + comments |
| `/drakor` | Drakor | K-drama favorites per member |
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
- `/leaderboard` — XP + per-game wins (`/api/leaderboard/games`)
- `/events` — admin event broadcast (rain, fireworks, etc.)
- `/upload` — file upload (photos, videos, audio, avatars)
- `/polls` — community voting polls + comments
- `/drakor` — K-drama favorites per member

### Database Tables (Drizzle / PostgreSQL)
- `um_users` — auth users with tokens
- `um_sessions` — auth sessions
- `um_members` — members with specialty, avatarUrl, kickReason
- `um_photos` — gallery photos
- `um_memories` — memories
- `um_links` — links
- `um_music` — music tracks
- `um_secrets` — vault secrets
- `um_opmem` — open member drives (acceptedMembers JSON)
- `um_mep` — MEP videos (videoUrl field)
- `um_chat_messages` — chat with reactions/stickers/replies
- `um_chat_dms` — private DMs
- `um_stickers` — sticker library
- `um_ngl_messages` — NGL anonymous messages
- `um_ngl_reactions` — reactions on NGL messages
- `um_ngl_comments` — comments on NGL messages
- `um_chat_reactions` — per-message reactions
- `um_reactions` — generic reactions (content_type + content_id)
- `um_votes` — generic votes (topic + option)
- `um_game_rooms` — game room state (JSON players/clues/votes)
- `um_game_states` — standalone game states
- `um_game_leaderboard` — per-game wins/losses/XP
- `um_admin_events` — admin-triggered visual events
- `um_polls` — community polls (options JSON + comments JSON)
- `um_drakor` — K-drama favorites per member (dramas JSON)

### Dynamic UI
- `DynamicSky.tsx` — animated starfield + particle system
  - Exports `useTimePhase()` hook: `{ phase, icon, img, label }`
  - Uses Twemoji CDN: `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/{codepoint}.svg`
  - Polls `/api/events` every 10s for admin events
  - Renders 10 event types: rain, coin_rain, fireworks, confetti, meteor, stars, snow, hearts, moon_rise, galaxy_blast
  - Shows countdown badge at top-center for active events
  - Prevents repeat-triggering of same event via `lastEventIdRef`
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

### Leaderboard
- **XP tab**: activity-based XP from chat, photos, games, memories
- **Game Wins tab**: per-game wins from `um_game_leaderboard`

## Important Developer Notes

- Frontend uses `fetch('/api/...')` directly (not generated hooks) for all new features
- File uploads stored at `/uploads/` (served as static from API server)
- NGL GET includes comments aggregated per message
- Members POST: `nickname` auto-defaults to `name` if not provided
- Members PATCH: partial update for avatar, role, etc.
- OpMem: `acceptedMembers` field (JSON array); endpoint `POST /api/opmem/:id/accepted`; delete `DELETE /api/opmem/:id/accepted/:idx`
- MEP: `videoUrl` is the DB column; form sends `{ videoUrl: form.url, ... }`
- Game rooms: full JSON state stored in `um_game_rooms` table
- Schema split: `chat.ts` has chatMessagesTable + nglMessagesTable; everything else in `content.ts`
- MobileNav "More" drawer has Voting + Drakor links added

## Key Constants
- Founded: **30/11/2025**
- Founder: iyuyun
- Admin token: `ADMIN UM SECRET`
- Member token: `MEMBER UM 2026`
- Vault PIN: `UM2025`
