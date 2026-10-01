# Product Requirements Document

## DrukJourneys — Bhutan Travel Agency Website

**Version:** 1.0
**Date:** July 27, 2026

---

## 1. Overview

DrukJourneys is a proposed online platform for a licensed Bhutanese tour operator, letting international, regional, and domestic travelers browse, customize, and book cultural, trekking, and festival tours across Bhutan — while giving internal agents and admins the tools to manage guides, drivers, hotel partners, and the Sustainable Development Fee (SDF)/visa process. This document defines the product's purpose, target users, goals, and prioritized feature set to guide design and engineering.

## 2. Problem Statement

Booking a trip to Bhutan is procedurally different from booking travel elsewhere: nearly all international tourists must go through a licensed operator, pay the Sustainable Development Fee, and obtain visa clearance before arrival — a process many travelers currently navigate through email chains, PDFs, and phone calls with agents. Meanwhile, small and mid-sized Bhutanese tour operators often lack a modern self-service platform that clearly explains SDF, handles document submission, and lets travelers customize an itinerary without back-and-forth. DrukJourneys aims to digitize this experience while staying compliant with Bhutan's "High Value, Low Volume" tourism policy.

## 3. Goals and Success Metrics

### 3.1 Business Goals

- Provide a clear, self-service digital front door for a Bhutanese DMC that reduces reliance on email/phone-based inquiries.
- Make the SDF, visa, and permit process transparent and less intimidating for first-time visitors to Bhutan.
- Increase average booking value through well-curated packages, festival-timed tours, and add-ons.
- Support the operator's compliance and reporting obligations to TCB.

### 3.2 Success Metrics

| Metric | Target |
|--------|--------|
| Inquiry-to-booking conversion rate | ≥ 5% of qualified inquiries within 6 months of launch |
| Average time to complete a booking (incl. document upload) | Under 15 minutes for a standard package |
| Customer support ticket volume (email/phone) | 25% reduction within 3 months post-launch |
| Platform uptime | 99.9% monthly |
| Traveler satisfaction (CSAT) post-trip | ≥ 4.3 / 5 |
| Repeat/referral bookings | ≥ 10% of new bookings sourced from past-traveler referral within year 1 |

## 4. Target Users and Personas

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| International Cultural Traveler | First-time visitor from Europe/N. America/Southeast Asia, motivated by dzongs, monasteries, and Tshechu festivals. | Clear SDF/visa explanation, curated itineraries, trust signals (reviews, licensing info). |
| Trekking Enthusiast | Experienced traveler booking Druk Path, Jomolhari, or Snowman Trek. | Difficulty ratings, permit handling for restricted areas, gear/altitude guidance. |
| Regional Traveler (India/Bangladesh/Maldives) | Enters under separate permit arrangements, often shorter trips. | Simplified permit process, budget-friendly packages, faster booking flow. |
| Domestic Traveler | Bhutanese citizen booking a local leisure trip. | No SDF/visa friction, simple booking for hotels/transport within Bhutan. |
| Tour Guide (internal) | TCB-licensed guide assigned to groups. | Schedule visibility, itinerary and traveler details on mobile. |
| Travel Agent / Admin (internal) | Curates packages, coordinates guides/drivers/hotels, manages SDF and reporting. | Efficient booking console, partner management, TCB-aligned reporting. |

## 5. Scope

### 5.1 In Scope (v1.0)

- Traveler account registration, package browsing, customization, and booking.
- SDF calculation, document upload, and visa/permit status tracking.
- Payment in USD (international) and BTN/INR (regional/domestic).
- Guide, driver, and hotel partner assignment tools for agents.
- Reviews, notifications, and basic customer support (FAQ + chat/WhatsApp).
- Admin reporting aligned with TCB's tourism data needs.

### 5.2 Out of Scope (v1.0)

- Native mobile apps (a responsive web app only for v1.0).
- Direct API integration with Drukair/Bhutan Airlines reservation systems (flights coordinated manually by agents in v1.0).
- Multi-language support beyond English (with Dzongkha terms for places/festivals).
- Loyalty/rewards program.

## 6. Features and Requirements (MoScoW Prioritization)

### 6.1 Must Have

| Feature | Description |
|---------|-------------|
| Account registration & login | Email/social login, password reset, role-based access. |
| Package browsing & customization | Browse by region/category, filter by duration/difficulty/budget, request custom itineraries. |
| SDF & visa document handling | SDF calculation by nationality/age/duration, document upload, status tracking. |
| Booking & checkout | End-to-end booking flow with guide/driver/hotel assignment and confirmation. |
| Payment processing | USD/BTN/INR payment via compliant gateway; separate SDF and package cost line items on receipts. |
| Agent console | Assign guides, drivers, vehicles, and hotels to confirmed bookings. |

### 6.2 Should Have

| Feature | Description |
|---------|-------------|
| Reviews & ratings | Post-trip reviews of packages, guides, and accommodations. |
| Notifications | Email/SMS/WhatsApp booking and visa/SDF status updates. |
| Reporting dashboard | Bookings by source market, season, and region for TCB-aligned reporting. |
| Festival/Tshechu calendar | Filter and highlight packages timed to major festivals. |
| Live chat/WhatsApp support | Real-time channel for pre-booking questions. |

### 6.3 Could Have

- Custom day-by-day itinerary builder with guide/driver contact details.
- Add-ons: travel insurance, extra restricted-area permits, private guide upgrade.
- Partial payment/deposit bookings for trips booked far in advance.

### 6.4 Won't Have (this release)

- Native iOS/Android apps.
- Direct airline reservation API integration.
- Loyalty points and rewards program.
- Multi-language support beyond English/Dzongkha terms.

## 7. User Stories (Sample)

- As an international traveler, I want to understand exactly what the Sustainable Development Fee covers and how much I'll pay, so that I can budget confidently before booking.
- As a trekking enthusiast, I want to see the difficulty level and permit requirements for each trek, so that I can choose a route that matches my fitness and experience.
- As a regional traveler, I want a simplified booking flow that doesn't require a full visa process, so that I can book a short trip quickly.
- As a travel agent, I want to assign a guide and driver to a confirmed booking, so that logistics are locked in well before the traveler arrives.
- As an admin, I want a report of bookings by source market and season, so that I can align staffing and marketing with demand patterns.
- As a traveler, I want to receive a WhatsApp update when my visa/SDF status changes, so that I don't have to keep checking manually.

## 8. Assumptions and Constraints

- The operator holds a valid TCB tour operator license and works with TCB-licensed guides and certified accommodations.
- SDF rates and exemption categories are set by TCB/RGoB and subject to change; the platform must allow rate updates without a code deployment.
- Card payment data will not be stored directly; a PCI-compliant gateway will be used, with USD as the primary settlement currency for international tourists.
- Peak season (spring and autumn) will drive the majority of traffic and bookings; the system should be load-tested against this seasonal pattern rather than a flat year-round average.

## 9. Milestones (Indicative)

| Phase | Deliverable | Target Timeframe |
|-------|-------------|-------------------|
| Discovery & Design | Finalized SRS, wireframes, architecture | Weeks 1–3 |
| MVP Development | Package browsing, booking, SDF/visa document flow, payment | Weeks 4–10 |
| Agent Console | Guide/driver/hotel assignment, reporting | Weeks 8–12 |
| QA & Beta | Internal testing, limited traveler beta ahead of peak season | Weeks 12–14 |
| Launch | Public release, timed ahead of the spring or autumn tourist season | Week 15 |

## 10. Risks

| Risk | Mitigation |
|------|-----------|
| Changes to SDF rates or visa procedures by TCB/RGoB | Keep SDF rate tables and document requirements configurable by admins, not hard-coded. |
| Payment gateway limitations for USD settlement in Bhutan | Confirm gateway/bank partnership (e.g., Bank of Bhutan, Bhutan National Bank, or an international processor) early in the design phase. |
| Seasonal traffic spikes overwhelming infrastructure | Load-test against peak spring/autumn season demand, not average annual traffic. |
| Low-bandwidth conditions for field agents/guides | Design the agent console to degrade gracefully on slow connections. |
| Scope creep beyond MVP | Enforce MoScoW prioritization and phase later features (multi-language, airline API integration) into v2. |

## 11. Open Questions

- Which bank or payment processor will handle USD-denominated tourist payments, and what are its integration requirements?
- Will the platform need to interface with TCB's SDF/visa portal directly, or will document submission remain a manual step performed by staff?
- Should the platform support group/multi-traveler bookings (common for family or small-group tours) as a distinct flow from individual bookings in v1.0?
