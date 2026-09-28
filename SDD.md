# System Design Document (SDD)

## DrukJourneys — Bhutan Travel Agency Website

**Version:** 1.0
**Date:** August 18, 2026
**Architecture style:** Modular monolith + isolated Payments and Document Storage services

---

## 1. Purpose

This document translates the SRS/PRD requirements and the approved architecture decision into a concrete design: component boundaries, data model, API contracts, and critical data flows. It is the reference used during implementation (Section 3 of the SDLC).

---

## 2. Architecture Overview

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB["React (Next.js) Web App"]
    end

    subgraph Gateway["API Gateway / BFF (Hono)"]
        GW["Auth check · Rate limiting · Input validation · TLS termination"]
    end

    subgraph Core["Core Application (Modular Monolith - Hono)"]
        AUTH["Auth & RBAC Module"]
        BOOK["Booking & Itinerary Module"]
        SDF["SDF / Visa Module"]
        ADMIN["Admin & Reporting Module"]
    end

    subgraph Isolated["Isolated Sensitive Services"]
        PAY["Payments Service\n(Stripe Elements + Bank API)"]
        DOC["Document Storage Service\n(Encrypted S3-compatible)"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL\n+ Prisma")]
        S3[("Object Storage")]
    end

    subgraph External["External Systems"]
        TCB["TCB SDF/Visa Portal\n(manual/API)"]
        BANK["Bank of Bhutan / BNB"]
        STRIPE["Stripe (USD)"]
        NOTIFY["Email / SMS / WhatsApp"]
    end

    WEB --> GW
    GW --> AUTH
    GW --> BOOK
    GW --> SDF
    GW --> ADMIN
    BOOK --> PAY
    SDF --> DOC
    AUTH --> PG
    BOOK --> PG
    SDF --> PG
    ADMIN --> PG
    PAY --> PG
    PAY --> STRIPE
    PAY --> BANK
    DOC --> S3
    SDF --> TCB
    BOOK --> NOTIFY
```

**Why this shape (recap):** the core app is one deployable unit for easier auditing and centralized RBAC enforcement; Payments and Document Storage are pulled out because they are the two highest-sensitivity data domains (card-adjacent data and passport/ID data) and benefit most from their own credentials and access boundary.

---

## 3. Component Responsibilities

| Component | Responsibility | Talks To |
|---|---|---|
| API Gateway | Single entry point; TLS termination, JWT verification, rate limiting, schema validation before requests reach business logic | All core modules |
| Auth & RBAC Module | Registration, login, password reset, role assignment (Tourist/Guide/Agent/Admin), JWT issuance | PostgreSQL |
| Booking & Itinerary Module | Package browsing, booking creation, guide/vehicle assignment, itinerary generation | PostgreSQL, Payments, Notifications |
| SDF/Visa Module | SDF calculation, document submission trigger, visa/permit status tracking | PostgreSQL, Document Storage, TCB portal |
| Admin & Reporting Module | Pricing/SDF rate management, guide/vehicle roster, TCB-aligned reports | PostgreSQL |
| Payments Service | Isolated handling of USD (Stripe) and BTN/INR (bank) payments; never stores raw card data | Stripe, Bank API, PostgreSQL (payment records only) |
| Document Storage Service | Encrypted storage of passport/ID uploads; issues short-lived signed URLs for authorized access | S3-compatible storage |

---

## 4. Entity-Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ BOOKING : makes
    USER {
        uuid id PK
        string email
        string password_hash
        string role
        string nationality
        string full_name
        datetime created_at
    }

    PACKAGE ||--o{ BOOKING : "booked as"
    PACKAGE {
        uuid id PK
        string title
        string dzongkhag
        string category
        int duration_days
        decimal base_price
        boolean requires_special_permit
    }

    BOOKING ||--|| SDF_RECORD : has
    BOOKING ||--o{ ITINERARY_DAY : contains
    BOOKING ||--o| PAYMENT : "paid via"
    BOOKING ||--o| GUIDE_ASSIGNMENT : has
    BOOKING {
        uuid id PK
        uuid user_id FK
        uuid package_id FK
        string status
        date start_date
        date end_date
        int traveler_count
        datetime created_at
    }

    SDF_RECORD {
        uuid id PK
        uuid booking_id FK
        string traveler_category
        decimal rate_per_night
        int nights
        decimal total_sdf
        string currency
    }

    DOCUMENT ||--|| SDF_RECORD : "attached to"
    DOCUMENT {
        uuid id PK
        uuid sdf_record_id FK
        string doc_type
        string storage_key
        string status
        datetime uploaded_at
    }

    ITINERARY_DAY {
        uuid id PK
        uuid booking_id FK
        int day_number
        string location
        string notes
    }

    GUIDE_ASSIGNMENT }o--|| GUIDE : assigns
    GUIDE_ASSIGNMENT {
        uuid id PK
        uuid booking_id FK
        uuid guide_id FK
        uuid vehicle_id FK
    }

    GUIDE {
        uuid id PK
        string name
        string license_number
        string status
    }

    VEHICLE {
        uuid id PK
        string plate_number
        string type
        string status
    }

    PAYMENT {
        uuid id PK
        uuid booking_id FK
        string currency
        decimal amount
        string method
        string status
        string provider_ref
    }

    REVIEW }o--|| BOOKING : "written for"
    REVIEW {
        uuid id PK
        uuid booking_id FK
        int rating
        string comment
        datetime created_at
    }
```

---

## 5. API Contract Sketch

Base path: `/api/v1`. All endpoints require a valid JWT except `POST /auth/register`, `POST /auth/login`, and public `GET /packages` browsing routes.

### 5.1 Auth Module

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Create account; captures nationality to determine traveler category |
| POST | `/auth/login` | None | Returns access + refresh JWT |
| POST | `/auth/refresh` | Refresh token | Issues new access token |
| GET | `/auth/me` | Any role | Returns current user profile |

### 5.2 Packages Module

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/packages` | None (public) | List/filter packages by dzongkhag, category, duration |
| GET | `/packages/:id` | None (public) | Package detail |

### 5.3 Booking Module

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | Tourist | Create a booking (draft status) for a package |
| GET | `/bookings/:id` | Owner / Agent / Admin | Booking detail including itinerary and SDF status |
| GET | `/bookings` | Owner (own) / Agent / Admin (all) | List bookings |
| PATCH | `/bookings/:id/assign-guide` | Agent / Admin | Assign guide + vehicle (blocks confirmation until set, per FR-15) |
| POST | `/bookings/:id/cancel` | Owner / Agent / Admin | Request cancellation |

### 5.4 SDF/Visa Module

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bookings/:id/sdf/calculate` | Tourist / Agent | Calculates SDF based on nationality, nights, traveler count |
| POST | `/bookings/:id/documents` | Tourist | Upload passport/ID document → forwarded to Document Storage Service |
| GET | `/bookings/:id/sdf-status` | Owner / Agent / Admin | Current visa/SDF/permit status |

### 5.5 Payments Module

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bookings/:id/payments/intent` | Owner | Creates a Stripe payment intent (USD) or bank payment reference (BTN) |
| POST | `/payments/webhook` | Signed webhook (Stripe) | Confirms payment success/failure asynchronously |
| GET | `/bookings/:id/invoice` | Owner / Agent / Admin | Itemized invoice (package cost + SDF, per FR-19) |

### 5.6 Admin Module

| Method | Path | Auth | Description |
|---|---|---|---|
| PUT | `/admin/sdf-rates` | Admin | Update SDF rate table (no redeploy needed, per NFR-9) |
| GET | `/admin/reports/bookings` | Admin | Bookings by source market/season/dzongkhag |
| POST | `/admin/guides` | Admin | Manage guide roster |

---

## 6. Critical Path Sequence Diagram

End-to-end flow: **Browse → Book → Submit SDF/Visa → Assign Guide → Pay → Confirm**

```mermaid
sequenceDiagram
    participant T as Tourist (Web App)
    participant GW as API Gateway
    participant BK as Booking Module
    participant SD as SDF/Visa Module
    participant DOC as Document Storage
    participant AG as Agent
    participant PAY as Payments Service
    participant ST as Stripe

    T->>GW: POST /bookings (package_id, dates)
    GW->>BK: create booking (status: draft)
    BK-->>T: booking_id

    T->>GW: POST /bookings/:id/sdf/calculate
    GW->>SD: calculate SDF (nationality, nights)
    SD-->>T: SDF amount + currency

    T->>GW: POST /bookings/:id/documents (passport)
    GW->>DOC: store encrypted, return signed key
    DOC-->>SD: document reference stored

    AG->>GW: PATCH /bookings/:id/assign-guide
    GW->>BK: assign guide + vehicle
    BK-->>AG: booking status: guide_assigned

    T->>GW: POST /bookings/:id/payments/intent
    GW->>PAY: create payment intent
    PAY->>ST: create Stripe PaymentIntent
    ST-->>PAY: client_secret
    PAY-->>T: client_secret (for hosted payment fields)

    T->>ST: submit card details directly (never touches our servers)
    ST-->>PAY: webhook: payment_succeeded
    PAY->>BK: mark booking confirmed
    BK-->>T: booking confirmed, e-voucher generated
```

Note the key security property in this flow: card details go **directly from the browser to Stripe**, never through our API — this is what keeps the system largely out of PCI-DSS card-data scope.

---

## 7. Deployment View

| Environment | Purpose | Notes |
|---|---|---|
| Dev | Local development | Docker Compose: Postgres, local Hono server, mock Stripe/TCB |
| QA/Test | Automated + manual test execution | Sandbox Stripe, mocked TCB workflow |
| Staging | Pre-production / UAT | Sandbox or limited-scope real integrations |
| Production | Live | Real integrations, monitoring/alerting active, automated backups |

---

## 8. Traceability

This SDD implements the architecture agreed in the prior discussion and should be read alongside:
- `SRS_DrukJourneys.md` — source of FR-#/NFR-# requirements referenced throughout
- `PRD_DrukJourneys.md` — feature prioritization driving what's built first
- `SDLC_DrukJourneys.md` — sprint plan this design feeds into
- `STLC_DrukJourneys.md` — test cases should map back to the modules/endpoints defined here