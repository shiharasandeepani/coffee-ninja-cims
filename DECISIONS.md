# Decisions

## Assumptions
Staff enter inquiries for customers. Seeded accounts are enough (no registration).

## Design choices
1. **Access:** staff see only inquiries they created; admin sees all. Enforced in the SQL query. Someone else's inquiry returns 404.
2. **Status rules:** New to In Progress to Resolved, Resolved can be reopened. New to Resolved is rejected (409). Enforced in the API.
3. **Bad and duplicate input:** the server validates every field and the form shows the errors. The same user, customer, contact and subject within 5 minutes is rejected as a duplicate (409).
4. **Stale data:** the client sends the `updated_at` it saw. If it changed, the API returns 409 and the UI shows the latest version with a message.

## Trade-off
The stale check is not atomic (check, then update), so two requests at the same instant could both pass. Accepted for simplicity.

## Testing gaps
Two tests only (status rules, login error). No API tests against a real database and no tests for the form or detail page.

## Next improvements
Atomic stale check, API tests, pagination, change history, client-side validation.

## Where AI helped
I used Claude to guide me step by step. It suggested a more complex stale check and client plus server validation; I chose simpler versions and kept the trade-off above.