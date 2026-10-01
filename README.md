# DrukJourneys

A Bhutan-context online travel agency platform: package browsing, Sustainable Development Fee (SDF) and visa handling, guided bookings, and multi-currency payments, built as a student project for the Bachelor of Engineering in Software Engineering program at the College of Science and Technology (CST), Royal University of Bhutan.

## Project Documentation

- [`SRS.md`](./SRS.md) — Software Requirements Specification
- [`PRD.md`](./PRD.md) — Product Requirements Document
- [`SDD.md`](./SDD.md) — System Design Document (architecture, ER diagram, API contracts)
- [`SECURITY_NOTES.md`](./SECURITY_NOTES.md) — running log of security decisions made during implementation

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [Hono](https://hono.dev/) (Node.js/TypeScript) |
| Database | PostgreSQL + [Prisma ORM](https://www.prisma.io/) |
| Auth | JWT (access tokens) + rotating opaque refresh tokens |
| Password hashing | argon2id |
| Validation | Zod |
| Local DB | Docker Compose |

## Architecture

DrukJourneys is built as a **modular monolith**: a single deployable backend organized into domain modules (`auth/`, and more to follow: `booking/`, `sdf/`, `admin/`), with Payments and Document Storage planned as the only more isolated components, since they handle the most sensitive data. See [`SDD.md`](./SDD.md) for the full architecture diagram and rationale.

## Getting Started (Local Development)

### Prerequisites

- Node.js (LTS)
- Docker Desktop

### 1. Start the database

```bash
docker compose up -d
```

### 2. Configure environment variables

Create `server/.env`:

```
DATABASE_URL="postgresql://drukjourneys:localdevpassword@localhost:5433/drukjourneys?schema=public"
JWT_SECRET="<a long random secret>"
```

### 3. Install dependencies and set up the database

```bash
cd server
npm install
npx prisma migrate dev
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

## API Overview

### Auth (`/auth`)

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create an account |
| POST | `/auth/login` | No | Log in, returns access + refresh token |
| POST | `/auth/refresh` | No (valid refresh token) | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | No (valid refresh token) | Revoke a refresh token |
| GET | `/auth/me` | Yes | Current user's profile |

Full API contract, including upcoming modules, is in [`SDD.md`](./SDD.md).

## Security Highlights

- Passwords hashed with argon2id; must contain upper/lowercase letters, a number, and a special character
- Access tokens (JWT) are short-lived (2 hours); refresh tokens are long-lived (7 days), stored server-side only as a SHA-256 hash, and rotated on every use
- Generic error messages prevent user-enumeration on login
- Role-based access control (Tourist / Guide / Agent / Admin) enforced via middleware
- See [`SECURITY_NOTES.md`](./SECURITY_NOTES.md) for the full, dated decision log

## Project Status

Currently in Sprint 1 (Agile/Scrum, per [`SDD.md`](./SDD.md) §5): Auth module complete (registration, login, RBAC, refresh/logout). Next up: Sprint 2, package browsing.
