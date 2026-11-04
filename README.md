# Acquisitions Application & Docker Guide

This repository contains the backend service for Acquisitions, built with Node.js, Express, Drizzle ORM, Arcjet, and Neon Serverless Postgres.

---

## 🏗 Architecture & Database Strategy

| Environment             | Database Target          | Proxy / Container                             | Driver Behavior                                                                                       |
| :---------------------- | :----------------------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Development (`dev`)** | Ephemeral Neon Branch    | Containerized `neondatabase/neon_local` proxy | Routes queries to `http://neon-local:5432/sql` and creates/cleans up an isolated branch automatically |
| **Production (`prod`)** | Persistent Neon Cloud DB | Direct connection (no proxy)                  | Standard Neon serverless HTTP connection via `DATABASE_URL` (`ep-*.neon.tech`)                        |

---

## 🚀 1. Local Development with Neon Local (Docker Compose)

[Neon Local](https://neon.com/docs/local/neon-local) runs a local proxy container (`neondatabase/neon_local`) that communicates with your Neon project. Every time you start the compose stack, it generates an isolated, ephemeral branch and deletes it when the container terminates.

### Step 1: Prepare Environment Variables

Copy `.env.development` or configure your local variables:

```bash
cp .env.development .env
```

Ensure you set your Neon API Key and Project ID (found in the [Neon Console](https://console.neon.tech)):

```env
NEON_API_KEY=your_neon_api_key
NEON_PROJECT_ID=your_neon_project_id
# Optional: source branch to branch off of (defaults to project main branch)
PARENT_BRANCH_ID=
DELETE_BRANCH=true
```

### Step 2: Start Development Containers

Run both the application and Neon Local via `docker-compose.dev.yml`:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development up --build
```

- **App container:** Accessible at `http://localhost:3000` with hot-reloading (`node --watch`) and source volume binding.
- **Neon Local proxy:** Running on `neon-local:5432` inside Docker network and forwarded to `localhost:5432` on your host machine.
- **Drizzle / Local tools:** If you run migrations or Drizzle Studio on your host machine, connect to `postgres://neon:npg@localhost:5432/neondb?sslmode=no-verify`.

### Step 3: Stopping the Development Stack

To shut down and automatically delete the ephemeral branch:

```bash
docker compose -f docker-compose.dev.yml down
```

---

## 🚢 2. Production Deployment (Neon Cloud)

In production, no Neon Local proxy is deployed. The container directly queries your Neon serverless cloud endpoint via the pooled connection string.

### Step 1: Configure Production Environment

Create or provide your `.env.production`:

```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
ARCJET_KEY=your_arcjet_production_key
```

### Step 2: Build and Run Production Container

Deploy using `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Or build and deploy the standalone Docker image with your container orchestrator (e.g. AWS ECS, Google Cloud Run, Kubernetes):

```bash
# Build production target image
docker build --target production -t acquisitions-api:prod .

# Run with environment injection
docker run -d \
  --name acquisitions-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  -e ARCJET_KEY="your_arcjet_key" \
  acquisitions-api:prod
```

---

## 🔀 How `DATABASE_URL` and Drivers Switch Between Environments

The database client in `src/config/database.js` inspects `NEON_FETCH_ENDPOINT`:

- **Development (`docker-compose.dev.yml`):**
  - `DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=no-verify`
  - `NEON_FETCH_ENDPOINT=http://neon-local:5432/sql`
  - The Neon serverless driver redirects HTTP fetch queries to the local `neon-local` proxy container.
- **Production (`docker-compose.prod.yml`):**
  - `DATABASE_URL=postgres://...@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
  - `NEON_FETCH_ENDPOINT` is omitted.
  - The driver connects natively to Neon Cloud over HTTPS.

---

## 🛠 Useful Commands

| Task             | Command                                                                      |
| :--------------- | :--------------------------------------------------------------------------- |
| Start Dev Stack  | `docker compose -f docker-compose.dev.yml --env-file .env.development up`    |
| Stop Dev Stack   | `docker compose -f docker-compose.dev.yml down`                              |
| View Dev Logs    | `docker compose -f docker-compose.dev.yml logs -f app`                       |
| Start Prod Stack | `docker compose -f docker-compose.prod.yml --env-file .env.production up -d` |
| Stop Prod Stack  | `docker compose -f docker-compose.prod.yml down`                             |
