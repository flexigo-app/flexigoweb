<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## TNC Insurance & Compliance Model (read before building driver/trip features)

FlexiGo is a **scheduled-only** Transportation Network Company (no instant/on-demand hailing). This changes our insurance model vs. Uber/Lyft and drives hard technical requirements — this isn't just business context, it's a compliance spec.

**Coverage periods** (we skip Period 1 "app on, waiting for request" entirely since every ride is pre-booked):
- **Period 2 (En Route to Pickup)** — starts when the driver begins traveling to the rider's pickup address. Must be triggered by an explicit driver action (e.g. "Start Trip to Rider") that logs a precise timestamp + GPS coordinates server-side.
- **Period 3 (Passenger On Board)** — starts at pickup, ends at drop-off. Requires two explicit driver actions — "Passenger Picked Up" and "Drop-off Complete" — each logging timestamp + GPS server-side. Full primary liability ($1M–$1.5M typical) applies during this period.

These logs are the audit trail insurers require to (a) prove a driver was actively on a FlexiGo trip during an accident claim, and (b) bill our usage-based insurance policy (we pay per mile/trip logged during Periods 2+3, against an upfront minimum annual deposit — not a flat per-driver cost).

**Implications for any trip/driver feature:**
- Every trip needs a server-side state machine, at minimum: `scheduled -> en_route -> passenger_onboard -> completed`, each transition timestamped and geo-tagged on the backend (not just a client-side flag).
- Never allow a driver to skip a transition (e.g. `scheduled` straight to `completed`) — this breaks the insurance audit trail and mileage billing.
- Driver onboarding must have a hook for automated MVR (Motor Vehicle Record) screening (e.g. Checkr, SambaSafety) against insurer-defined eligibility criteria (age, experience, violation history) before a driver can go active — we use a usage-based Master/Blanket TNC policy (common brokers: InsureLimos, ABI, SWAN) instead of submitting a static driver list, so this app-side enforcement *is* the underwriting control.
