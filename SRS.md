# Software Requirements Specification

## DrukJourneys — Bhutan Travel Agency Website

**Version:** 1.0
**Date:** July 27, 2026
**Prepared in accordance with IEEE 830-1998 SRS guidelines**

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) describes the functional and non-functional requirements for **DrukJourneys**, an online travel agency website for a Bhutanese tour operator. It is intended for the development team, project stakeholders, quality assurance staff, and course evaluators as the authoritative reference for what the system must do, in line with Bhutan's tourism regulations and the operating realities of a Bhutan-based Destination Management Company (DMC).

### 1.2 Scope

DrukJourneys is a web-based platform that allows international and regional (Indian, Bangladeshi, Maldivian) tourists, as well as domestic travelers, to browse, customize, and book tour packages within Bhutan. As a licensed Bhutanese tour operator, the platform must integrate the country's specific tourism framework:

- **Sustainable Development Fee (SDF)** calculation and collection, as mandated by the Tourism Council of Bhutan (TCB).
- **Licensed tour operator and guide requirements** — all international tourists (excluding Indian, Bangladeshi, and Maldivian nationals under current bilateral arrangements) must travel through a licensed Bhutanese tour operator with a certified guide.
- **Visa/entry permit processing** coordinated through the Department of Immigration and the online visa/SDF portal.
- **Restricted area permits** (e.g., Special Area Permits for Bumthang, Trashigang, Haa, and other regions) issued by the Immigration Office/Regional Immigration and Foreigner Central Registry (RIFCR) offices.
- **Package itineraries** covering major destinations (Paro, Thimphu, Punakha, Wangdue, Bumthang, Haa) and trekking routes (Druk Path, Jomolhari, Snowman Trek).
- **Local transport and guide/driver assignment**, hotel/farmstay bookings with TCB-certified accommodations, and cultural/festival (Tshechu) calendar integration.

The system will **not** include: airline ticketing systems themselves (flights are booked via Drukair/Bhutan Airlines reservation systems, accessed through partner coordination or manual agent booking, since Bhutan currently has no open API-based GDS access for its national carriers), visa/SDF approval authority (the system only facilitates document submission and fee payment; final approval rests with the Department of Immigration/TCB), or currency exchange/forex trading.

### 1.3 Definitions, Acronyms, and Abbreviations

- **SRS** – Software Requirements Specification
- **TCB** – Tourism Council of Bhutan
- **SDF** – Sustainable Development Fee, charged per tourist per night
- **RIFCR** – Regional Immigration and Foreigner Central Registry
- **DMC** – Destination Management Company
- **BTN/Nu.** – Bhutanese Ngultrum
- **RMA** – Royal Monetary Authority of Bhutan
- **BOB / BNB / BDBL** – Bank of Bhutan, Bhutan National Bank, Bhutan Development Bank Limited
- **Tshechu** – Annual religious mask-dance festival held at dzongs and monasteries
- **Dzongkha** – National language of Bhutan
- **JWT** – JSON Web Token, used for authentication

### 1.4 References

- IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications
- Tourism Council of Bhutan — Tourism Levy and Regulation guidelines
- Royal Monetary Authority of Bhutan — payment and foreign exchange regulations
- Department of Immigration, Bhutan — visa and permit procedures
- WCAG 2.1 Level AA Accessibility Guidelines

### 1.5 Overview

Section 2 provides an overall description of the product, its users, and constraints specific to Bhutan's tourism model. Section 3 lists specific functional and non-functional requirements. Section 4 defines external interface requirements. Appendices provide supporting detail.

---

## 2. Overall Description

### 2.1 Product Perspective

DrukJourneys is a new, self-contained web application composed of a customer-facing responsive web front end, a backend API layer, a relational database, and integrations with TCB's SDF/visa portal, local payment gateways, and notification providers. It operates as the digital storefront of a licensed Bhutanese tour operator and must reflect Bhutan's "High Value, Low Volume" tourism policy rather than a mass-market OTA model.

### 2.2 Product Functions (Summary)

- Account registration, authentication, and profile management
- Tour package browsing and customization (cultural tours, trekking, festival tours, wellness/retreat tours)
- SDF calculation, visa document submission, and permit request tracking
- Itinerary builder with day-by-day plans, guide/driver assignment, and accommodation selection
- Booking, payment (in USD/BTN as applicable), and confirmation/voucher generation
- Reviews and ratings from past travelers
- Notifications (booking status, permit approval, itinerary changes)
- Admin/agent back office for guides, vehicles, hotel partners, and package management

### 2.3 User Classes and Characteristics

- **International Tourist (non-regional)** — must book through a licensed operator; requires visa, SDF payment, and guide; typically higher-budget, culturally motivated traveler.
- **Regional Tourist (Indian/Bangladeshi/Maldivian national)** — enters under separate regulatory provisions (permit rather than visa; different SDF rate); may book independently or through the operator.
- **Domestic Traveler** — Bhutanese citizen booking local leisure travel; not subject to SDF or visa requirements.
- **Tour Guide** — TCB-licensed guide assigned to a group; needs schedule visibility and itinerary access.
- **Travel Agent (internal staff)** — curates packages, coordinates with hotels/guides/drivers, manages bookings.
- **Administrator** — manages pricing, SDF rate updates, licensing documentation, reporting, and content.

### 2.4 Operating Environment

The web application must run on current versions of Chrome, Firefox, Safari, and Edge, and be responsive across desktop, tablet, and mobile screen sizes, since a significant share of inbound inquiries originate from mobile devices in source markets (India, Southeast Asia, Europe, North America). The backend should be deployable on cloud infrastructure with servers positioned to give acceptable latency for both Bhutan-based staff and international customers.

### 2.5 Design and Implementation Constraints

- SDF rates and exemption categories (e.g., discounted SDF for children, Indian/Bangladeshi/Maldivian nationals) are set by TCB/RGoB and may change; the system must allow rate updates without code changes.
- International payments should support USD as the primary settlement currency for foreign tourists (per RMA convertible currency regulations for tourism receipts), with BTN/INR handling for domestic and regional transactions.
- Internet connectivity in some Bhutanese destinations (e.g., remote dzongkhags, trekking regions) is limited; the admin/agent console used in the field should tolerate intermittent connectivity.
- The system must accommodate Dzongkha-script content (e.g., place names, festival names) alongside English.

### 2.6 Assumptions and Dependencies

- TCB's SDF/visa online system remains the authoritative channel for visa clearance and SDF payment confirmation; DrukJourneys integrates with or submits to it rather than replacing it.
- Partner hotels, guides, and drivers are engaged under existing DMC contracts and their availability is communicated to the platform (manually or via a simple partner portal).
- Users have internet access and a modern browser or mobile device.
- Currency conversion rates (USD/BTN/INR) are sourced from RMA or a reliable financial data provider.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | The system shall allow a visitor to register an account using email/password or a supported social login provider. | High |
| FR-2 | The system shall allow a registered user to log in and log out securely. | High |
| FR-3 | The system shall support role-based access control for Tourist, Agent, Guide, and Admin roles. | High |
| FR-4 | The system shall allow users to view and edit their profile, passport/travel document details, and payment methods. | Medium |
| FR-5 | The system shall allow users to reset a forgotten password via a verified email or phone number. | High |

#### 3.1.2 Package Browsing and Customization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6 | The system shall allow users to browse tour packages by category (cultural, trekking, festival/Tshechu, wellness) and by dzongkhag/region. | High |
| FR-7 | The system shall allow filtering by trip duration, group size, difficulty (for treks), and budget. | Medium |
| FR-8 | The system shall allow users to view a festival/Tshechu calendar and filter packages aligned with specific festival dates. | Medium |
| FR-9 | The system shall allow users to request a fully customized itinerary in addition to fixed packages. | Medium |

#### 3.1.3 Visa, Permits, and SDF

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10 | The system shall calculate the applicable Sustainable Development Fee (SDF) based on traveler nationality, age, and length of stay. | High |
| FR-11 | The system shall allow users to upload passport and required documents for visa/permit processing. | High |
| FR-12 | The system shall track and display the status of visa clearance and any restricted-area (Special Area) permit requests. | High |
| FR-13 | The system shall generate the necessary supporting documentation for submission to TCB/Department of Immigration on the traveler's behalf. | Medium |

#### 3.1.4 Booking and Reservation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-14 | The system shall allow a user to book a fixed package or a customized itinerary, including guide, driver, vehicle, and accommodation assignment. | High |
| FR-15 | The system shall generate a booking confirmation and voucher upon successful payment and visa/SDF clearance. | High |
| FR-16 | The system shall allow a user to view booking history and current booking/permit status. | High |
| FR-17 | The system shall allow a user to request cancellation or modification, subject to operator and TCB refund policy. | Medium |

#### 3.1.5 Payment Processing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-18 | The system shall support payment in USD (for most international tourists) and BTN/INR (for regional and domestic travelers) via a compliant payment gateway. | High |
| FR-19 | The system shall generate and email an invoice/receipt covering package cost and SDF separately, for transparency. | High |
| FR-20 | The system shall support a deposit/partial payment model where the operator's policy allows, given many bookings are made months in advance. | Low |

#### 3.1.6 Itinerary and Trip Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-21 | The system shall allow users to view a day-by-day itinerary including guide/driver contact details and accommodation names. | Medium |
| FR-22 | The system shall allow add-ons such as travel insurance, extra trekking permits, or private guide upgrades. | Low |

#### 3.1.7 Reviews and Ratings

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-23 | The system shall allow travelers who completed a trip to submit a rating and written review of the tour, guide, and accommodations. | Medium |
| FR-24 | The system shall display an aggregated average rating on package and guide profile pages. | Medium |

#### 3.1.8 Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-25 | The system shall send booking confirmations, visa/SDF status updates, and itinerary change alerts via email and/or SMS. | High |

#### 3.1.9 Administration and Agent Tools

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-26 | The system shall allow Admins to manage packages, SDF rate tables, and pricing. | High |
| FR-27 | The system shall allow Agents to assign guides, drivers, and vehicles to confirmed bookings. | High |
| FR-28 | The system shall provide Admins with reports on bookings by source market, season, and region, to support TCB reporting obligations. | Medium |
| FR-29 | The system shall allow Admins to manage the festival/Tshechu calendar and promotional content. | Low |

#### 3.1.10 Customer Support

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-30 | The system shall provide a live chat or messaging channel (including WhatsApp integration, widely used by Bhutanese operators) for customer inquiries. | Medium |
| FR-31 | The system shall provide a searchable FAQ covering visa, SDF, packing lists, altitude/trekking advice, and a support ticketing system. | Medium |

### 3.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Search and package results shall be returned within 3 seconds under normal load (95th percentile). | High |
| NFR-2 | The system shall support at least 1,000 concurrent users during peak season (March–May, September–November), reflecting Bhutan's seasonal tourism pattern. | High |
| NFR-3 | The system shall maintain 99.9% uptime, measured monthly. | High |
| NFR-4 | All data in transit shall be encrypted using TLS 1.2 or higher. | High |
| NFR-5 | The system shall not store raw payment card data; card processing shall be delegated to a PCI-DSS compliant gateway. | High |
| NFR-6 | Passport and personal identification data shall be encrypted at rest and access-restricted to authorized staff only, consistent with Bhutanese data protection norms and immigration confidentiality requirements. | High |
| NFR-7 | The public-facing web interface shall conform to WCAG 2.1 Level AA accessibility guidelines. | Medium |
| NFR-8 | The system shall be responsive across desktop, tablet, and mobile viewport sizes, given the high proportion of mobile-originated inquiries from overseas markets. | High |
| NFR-9 | The agent/admin console shall function reasonably under intermittent or low-bandwidth internet connections, for use in remote dzongkhags. | Medium |
| NFR-10 | The system shall perform automated daily backups with a documented disaster-recovery procedure (RPO ≤ 24h, RTO ≤ 4h). | Medium |

### 3.3 External Interface Requirements

#### 3.3.1 User Interfaces

A responsive web interface accessible via desktop and mobile browsers. Key screens include: Home/Package Browse, Package Detail, Customization/Itinerary Builder, Visa & SDF Submission, Booking/Checkout, Traveler Dashboard, and Admin/Agent Console.

#### 3.3.2 Hardware Interfaces

None beyond standard client devices (desktop, laptop, tablet, smartphone) and server infrastructure.

#### 3.3.3 Software Interfaces

- TCB SDF/visa online portal (for submission and status checks, where an interface is available; otherwise manual/document-based workflow).
- Payment gateway supporting USD settlement for international tourists, and BTN/INR for regional/domestic transactions.
- Email/SMS/WhatsApp gateway for notifications.
- Mapping/geolocation service for itinerary and route visualization across Bhutan's dzongkhags.

#### 3.3.4 Communications Interfaces

All client-server communication shall occur over HTTPS. Backend services shall communicate with third-party APIs over HTTPS/REST or the provider's supported SDK.

### 3.4 Other Requirements

- The system shall log all booking, payment, and SDF-related transactions for audit purposes, retained per applicable regulatory requirements.
- The system shall support content in English and, where feasible, Dzongkha for key place names and cultural terms.

---

## 4. Appendix

### 4.1 Requirements Traceability Note

Each functional requirement (FR-#) and non-functional requirement (NFR-#) in this document should be traced to corresponding test cases during the verification phase. A separate Requirements Traceability Matrix (RTM) may be maintained alongside this SRS.

### 4.2 Approval

This document is subject to review and sign-off by the project supervisor/stakeholder prior to the start of the design phase.
