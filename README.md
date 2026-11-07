# GebetaPro — Local Discovery & Professional Directory Platform

A web-based SaaS platform where professionals, skilled individuals, local businesses, and shops can create public profiles to showcase their services, working hours, portfolio, social channels, and GPS location. Visitors can discover verified professionals near them, view reviews, and connect directly via WhatsApp, Telegram, or Phone.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite (Tailwind CSS, Lucide Icons, MapLibre / Leaflet) |
| **Backend** | Node.js (ES Modules) + Express.js modular monolith |
| **Database** | PostgreSQL 16 + PostGIS spatial extensions |
| **Authentication** | JWT (access tokens) + rotating HttpOnly refresh tokens |
| **File Storage** | Supabase Storage (public images & private verification docs) |
| **Payments** | Chapa API (ETB subscription plans) |
| **DevOps & Edge** | Cloudflare Workers, GitHub Actions CI/CD, Docker |

---

## Repository Structure

```
Web_Based_SaaS_Advertisement_Management_System/
├── frontend/               # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/     # UI primitives, layout wrappers, modals
│   │   ├── features/       # Domain modules (profiles, subscriptions, admin, etc.)
│   │   ├── pages/          # Routed page views (Directory, Profile, Dashboard)
│   │   ├── routes/         # App routing and route guards
│   │   └── services/       # API client abstractions
│   └── public/             # Static web assets
├── backend/                # Node.js + Express API
│   ├── database/           # 39+ PostgreSQL migrations & seed data
│   ├── src/
│   │   ├── config/         # Central environment & swagger configuration
│   │   ├── db/             # Connection pooling (pg Pool) & health check
│   │   ├── middleware/     # Auth, validation (Zod), rate limiting, error handling
│   │   ├── modules/        # Modular API controllers, services, repositories
│   │   ├── workers/        # Scheduled jobs & subscription expiry workers
│   │   └── utils/          # Logger (Pino), storage (Supabase), JWT helpers
│   └── tests/              # API and database integration tests
├── docs/                   # Central technical documentation
│   ├── architecture/       # System design, auth flows, agent handoff
│   ├── guides/             # Developer 1, 2, and 3 pre-launch execution guides
│   ├── phases/             # Phase specifications & development history
│   └── reports/            # WCAG accessibility & quality audits
├── infra/                  # Docker, Nginx, environment deployment templates
├── scripts/                # Database and development helper utilities
├── .github/                # GitHub Actions deployment workflows
├── docker-compose.yml      # Local container orchestration
└── README.md
```

---

## Developer Quick-Start Guides

For sprint execution and task breakdown, refer to the guides in `docs/guides/`:

- **[Developer 1 — Frontend & Public Discovery](docs/guides/DEVELOPER_FRONTEND_DISCOVERY_GUIDE.md)**
- **[Developer 2 — Backend, Geo & Automations](docs/guides/PART_2_UNSTARTED_TASKS_TECHNICAL_GUIDE.md)**
- **[Developer 3 — Dashboard, Security, SEO & DevOps](docs/guides/DEVELOPER_3_DASHBOARD_SECURITY_DEVOPS_GUIDE.md)**

---

## Getting Started (Local Development)

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 15
- npm >= 9

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # configure your DATABASE_URL and secrets
npm run db:migrate     # apply pending migrations
npm run dev            # starts server on http://localhost:3000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev            # starts Vite dev server on http://localhost:5173
```

---

## Deployment (Cloudflare)

Pushing to `main` builds the frontend and deploys the Worker through GitHub Actions (`.github/workflows/deploy-cloudflare.yml`). Configure required repository secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- Application environment variables inside Cloudflare Worker secrets.
