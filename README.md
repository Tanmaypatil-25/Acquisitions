# Acquisitions API

Acquisitions is a production-grade, secure RESTful backend service built with Node.js, Express, Drizzle ORM, Arcjet security, and Neon Serverless PostgreSQL. It features full JWT-based authentication, role-based access control (RBAC), multi-layer bot & DDoS protection, dual-environment database branching (via Neon Local), and automated multi-architecture CI/CD pipelines.

---

## ⚡ Core Features

- **Authentication & RBAC:** Secure sign-up, sign-in, and sign-out with HTTP-only cookies, password hashing (bcrypt), JWT verification, and role-based permissions (`admin` vs `user`).
- **User CRUD & Self-Ownership:** Validated endpoints (Zod) allowing users to retrieve and edit their own profiles while restricting role modifications and account deletions to administrators.
- **Arcjet Security Suite:** Adaptive rate limiting via sliding windows, automated bot protection, and attack shielding.
- **Database Architecture:** Neon Serverless PostgreSQL with Drizzle ORM, supporting ephemeral local database branching for rapid development and direct pooled cloud connections in production.
- **Testing & Quality:** Jest test suite with native ESM support (`--experimental-vm-modules`), Supertest, ESLint, and Prettier formatting.
- **Docker & CI/CD:** Multi-stage `Dockerfile`, Docker Compose for local/prod runs, and GitHub Actions workflows for continuous integration, testing with coverage artifacts, and multi-arch Docker image publication (`linux/amd64`, `linux/arm64`).

---

## 📁 Project Structure

```text
Acquisitions/
├── .github/workflows/         # CI/CD pipelines (lint/format, tests, docker push)
├── drizzle/                   # Database schema migrations
├── scripts/                   # Helper scripts for dev/prod docker orchestration
├── src/
│   ├── config/                # Arcjet, database (Neon), and Winston logger configs
│   ├── controllers/           # Route controller handlers (auth, users)
│   ├── middleware/            # Security (Arcjet) and authentication/RBAC middleware
│   ├── models/                # Drizzle ORM database schemas
│   ├── routes/                # Express API routes
│   ├── services/              # Core business and data access logic
│   ├── utils/                 # Cookies, JWT helpers, and error formatting
│   ├── validations/           # Zod request validation schemas
│   ├── app.js                 # Express application configuration
│   └── server.js              # HTTP server entrypoint
├── tests/                     # Unit and integration test suites
├── docker-compose.dev.yml     # Local dev compose stack (App + Neon Local proxy)
├── docker-compose.prod.yml    # Production compose stack (Cloud Neon connection)
└── Dockerfile                 # Multi-stage production and development Dockerfile
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** v20+ or v22+
- **Docker & Docker Compose** (for containerized runs)
- A **Neon PostgreSQL** account ([console.neon.tech](https://console.neon.tech))

### 2. Environment Setup

Create your local environment file:

```bash
cp .env.example .env
```

Populate required variables (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `ARCJET_KEY`, etc.). Template references are provided in `.env.development.example` and `.env.production.example`.

### 3. Local Development (Native)

```bash
# Install dependencies
npm ci

# Run database migrations
npm run db:migrate

# Start development server with live reload
npm run dev
```

### 4. Local Development (Docker with Neon Local)

Neon Local spins up a local proxy that automatically provisions an isolated, ephemeral database branch on startup and destroys it upon shutdown:

```bash
# Start app + Neon Local proxy
docker compose -f docker-compose.dev.yml --env-file .env.development up --build

# Stop stack and clean up ephemeral branch
docker compose -f docker-compose.dev.yml down
```

---

## 📡 API Reference

| Method   | Endpoint             | Access / Role | Description                                           |
| :------- | :------------------- | :------------ | :---------------------------------------------------- |
| `GET`    | `/health`            | Public        | System status, timestamp, and server uptime           |
| `GET`    | `/api`               | Public        | API service health verification                       |
| `POST`   | `/api/auth/sign-up`  | Public        | Register new user account                             |
| `POST`   | `/api/auth/sign-in`  | Public        | Sign in and receive HTTP-only JWT cookie              |
| `POST`   | `/api/auth/sign-out` | Public        | Invalidate auth cookie                                |
| `GET`    | `/api/users`         | Admin         | Retrieve a list of all registered users               |
| `GET`    | `/api/users/:id`     | Authenticated | Retrieve specific user profile                        |
| `PUT`    | `/api/users/:id`     | Owner / Admin | Update user details (role modification is admin-only) |
| `DELETE` | `/api/users/:id`     | Admin         | Delete user record from the database                  |

---

## 🧪 Testing & Code Quality

```bash
# Run unit and integration tests with coverage
npm test

# Check linting and formatting
npm run lint
npm run format:check

# Automatically fix linting and formatting issues
npm run lint:fix
npm run format
```

---

## 🚢 Production Deployment

### Docker Compose Production

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### CI/CD Pipelines (GitHub Actions)

- **Lint & Format (`lint-and-format.yml`):** Runs ESLint and Prettier checks on push/PR to `main` and `staging`.
- **Automated Tests (`tests.yml`):** Executes test suites, attaches step summaries, and archives coverage reports as artifacts (30 days retention).
- **Docker Build & Push (`docker-build-and-push.yml`):** Builds multi-arch images (`linux/amd64`, `linux/arm64`) using Docker Buildx and publishes tagged versions to Docker Hub on release.
