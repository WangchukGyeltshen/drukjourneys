# DrukJourneys frontend plan

Where the Next.js frontend (`web/`) stands and what the owner wants it to become. Updated as decisions are made.

## Look and feel goals

- **Interactive hero (wanted, not started).** The home page hero should be something the visitor uses, not only a banner. Inspiration is the idea of a hero where the visitor answers a question by picking tiles, then presses a button and the page responds. Take the interaction, not another company's layout or branding.
  - Question such as "What kind of trip are you after?" with tiles for Culture, Festivals, Trekking, Pilgrimage, Adventure and Wellness, each with a photo.
  - Choosing tiles and pressing "Show trips" leads to the package list, filtered with the existing category filter. A second step for length of trip and dzongkhag is possible.
  - Optional live preview that shows how many packages match as tiles are chosen.
  - Tiles are real form controls: keyboard and screen reader friendly, and a plain form fallback when JavaScript is off.
  - Light on data: small photos loaded on demand (NFR-9).
  - Open questions for when it is built: pick one tile or several, how many steps, whether it replaces the filter bar or sits above it.
- Photo credits shown under hero photos once the sources are known.
- Custom browser-tab icon and removal of the unused default images in `web/public`.

## Done

- Browse page with filters, pagination, photo cards; package detail page with reviews list; per-package page titles.
- Home page hero (static banner with photo, short promises, button to the list).
- Register, sign in, sign out; sessions in httpOnly cookies; automatic refresh through a proxy; visitor IP forwarded so rate limits stay per visitor.
- Dzongkha font as an on-demand fallback and a `<Dzongkha>` wrapper (no Dzongkha content yet).

## Planned, in the proposed order

1. Booking: "Book this trip" form on the package page (dates, travellers; sign-in required), then a booking summary with the Sustainable Development Fee.
2. Documents: upload passport, visa and photo; show review status.
3. Payment: card payment (Stripe test card), confirmation page with guide and vehicle once assigned.
4. My bookings: status and cancel.
5. Reviews: writing a review for a confirmed booking; paginating the list.
6. FAQ and support contact form, then footer links to them.
7. Notifications inbox for travellers.
8. Staff console: manage packages, guides and vehicles; assign guides; review documents.
9. Admin: reports and the document access log.
10. The interactive hero above.
11. End checks: accessibility and phone-width review of every page (NFR-7, NFR-8), a Content-Security-Policy header, security notes update.

## Standing rules for this frontend

- Mobile first, works without JavaScript where it reasonably can, visible focus, targets of at least 44 px, reduced motion respected.
- The browser never calls the API directly; tokens stay in httpOnly cookies. No CORS rule is needed.
- Check this Next.js version's own docs in `web/node_modules/next/dist/docs/` before writing Next.js code (see `web/AGENTS.md`).
