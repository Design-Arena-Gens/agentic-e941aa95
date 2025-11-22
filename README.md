## Binary Options Signal Hub

End-to-end trading intelligence stack delivering 5-minute binary options signals across major forex pairs. The system combines a Next.js dashboard, REST API, Prisma-backed persistence, and a Telegram bot for downstream distribution.

### Features
- Automated RSI (14), MACD (12/26/9), and dynamic support/resistance engine running on 1-minute Yahoo Finance data aggregated to 5-minute candles.
- Signal generation with configurable quality filters and sensitivity controls stored in SQLite via Prisma.
- Secure auth (NextAuth credentials) with role-based access; first registered user is auto-promoted to admin.
- Dark-themed dashboard presenting trend overview, pair coverage, next entry timing, and the latest 20 signals.
- Admin console for tuning engine parameters and manually triggering signal refreshes.
- REST API for signals, settings, cron integration, and pair metadata—ready for third-party clients.
- Telegram bot (Telegraf) capable of on-demand signal retrieval and broadcasts.

### Tech Stack
- Next.js 16 (App Router) + Tailwind CSS 4 (native)
- Prisma ORM with SQLite (local) or external DB via `DATABASE_URL`
- NextAuth.js (credentials provider + Prisma adapter)
- Axios + technicalindicators for market data/indicators
- Telegraf for Telegram automation

### Prerequisites
- Node.js 18+
- npm (ships with Node)
- Optional: Vercel CLI (`npm i -g vercel`) for deployment
- Telegram bot token (BotFather) if enabling bot

### Environment Variables
Copy `.env` to `.env.local` and adjust:

```
DATABASE_URL="file:./prisma/data.db"         # swap with postgres/mysql url in production
NEXTAUTH_SECRET="your-random-secret"         # `openssl rand -base64 32`
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET=""                               # optional shared secret for cron endpoint
TELEGRAM_BOT_TOKEN=""                        # optional bot token
TELEGRAM_CHAT_ID=""                          # optional broadcast chat/channel id
SIGNAL_API_BASE_URL="http://localhost:3000/api"
```

### Setup & Development
```bash
npm install
npx prisma migrate dev --name init   # create SQLite DB locally
npm run dev                          # start Next.js on http://localhost:3000
```

Create an account via `/register`. The first account becomes `ADMIN`, granting access to `/admin` for tuning and trigger controls.

### Signal Generation
- Navigate to `/admin` (admin only) and use “Generate signals now” for manual runs.
- REST endpoint `POST /api/signals` (auth: admin) triggers generation programmatically.
- For automated scheduling, hit `/api/cron/generate?secret=...` using Vercel cron or any scheduler. Set `CRON_SECRET` to protect the route.

### REST API Overview
| Method | Route                         | Auth            | Description |
|--------|------------------------------|-----------------|-------------|
| GET    | `/api/signals?limit=20`       | session (user)  | Latest signals |
| POST   | `/api/signals`               | session (admin) | Run generator |
| GET    | `/api/pairs`                 | session (user)  | Trend metadata for monitored pairs |
| GET    | `/api/settings`              | session (user)  | Current thresholds |
| PUT    | `/api/settings`              | session (admin) | Update thresholds |
| GET    | `/api/cron/generate`         | secret optional | Cron-safe generator trigger |
| POST   | `/api/users/register`        | public          | Register account (first=admin) |

All responses are JSON. Signal payloads include RSI, MACD histogram, support/resistance levels, quality, trend bias, and metadata (e.g., next entry window).

### Telegram Bot
1. Set `TELEGRAM_BOT_TOKEN` and (optionally) `TELEGRAM_CHAT_ID`.
2. Ensure `SIGNAL_API_BASE_URL` points to the accessible API origin (production URL after deploy).
3. Run locally with:
   ```bash
   npm run bot
   ```
4. Commands:
   - `/start` — introduction and usage hints.
   - `/signals` — fetch latest signals (top 5).
   - `/subscribe` — store current chat as broadcast target.
   - `/broadcast` — push latest signals to subscribed chat/channel.

### Deployment (Vercel)
1. Build locally to verify:
   ```bash
   npm run build
   ```
2. Provide production-ready environment variables in Vercel dashboard or via `vercel env`.
   - Replace `DATABASE_URL` with a production-grade DB (e.g., Vercel Postgres, Neon, PlanetScale).
   - Run migrations: `npx prisma migrate deploy`.
3. Deploy:
   ```bash
   vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-e941aa95
   ```
4. Verify post-deploy:
   ```bash
   curl https://agentic-e941aa95.vercel.app
   ```

### Testing & Quality
- `npm run lint` — ESLint (Next.js preset).
- `npm run prisma:generate` — regenerate Prisma client.
- `npm run db:push` / `npm run db:migrate` — schema management helpers.

### Directory Highlights
- `src/app/**` — Next.js App Router pages, API routes, styles.
- `src/lib/**` — Prisma client, signal engine, settings helpers.
- `src/components/**` — UI building blocks and admin dashboard widgets.
- `telegram/bot.ts` — Telegraf bot entry point.
- `prisma/schema.prisma` — database schema.

### Production Notes
- Replace SQLite with a cloud database before deploying. Update `DATABASE_URL` accordingly.
- Configure `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `CRON_SECRET` in production.
- For continuous signal generation, schedule `/api/cron/generate` at a 5-minute cadence.
- Remember to secure Telegram bot tokens and broadcast chat IDs.

### License
MIT — customize freely for commercial or personal usage.
