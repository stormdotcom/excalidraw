# Premium subscription follow-up

The first Premium-ready feature is implemented as a public preview: the Studio paper pack adds dot-grid, Cornell, and six-panel storyboard pages. These paper guides persist with a notebook and are included in PNG/PDF exports.

Before charging for Premium access:

- Add a server-owned entitlement API. Do not trust `localStorage`, query strings, or a client-only feature flag as proof of purchase.
- Choose billing and account providers, then verify purchases and webhook events on the server. Never expose billing secrets in the browser bundle.
- Define signed entitlement data and an offline grace period so paid Studio papers keep working temporarily when the device has no connection.
- Keep existing Studio pages readable and exportable after a subscription ends. Restrict creating new Premium pages rather than locking a user's existing work.
- Add restore-purchase, cancellation, failed-payment, refund, and account-deletion flows before enabling the Upgrade button.
- Decide the next paid features. Good client-side candidates are custom saved palettes, project folders, reusable page templates, and batch export.
- Add pricing, renewal, tax, privacy, and subscription terms appropriate to the platforms where the app will be sold.
- Add entitlement tests for active, expired, offline-grace, refunded, and unknown states. The UI must fail open for reading/exporting existing notes and fail closed only for creating new Premium content.

The current preview deliberately contains no payment button, fake checkout, or client-side unlock that could be mistaken for secure subscription enforcement.
