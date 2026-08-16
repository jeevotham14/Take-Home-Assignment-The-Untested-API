# Submission Notes

## What I'd test next if I had more time

- I would add more edge case tests for `validators.js` to increase branch coverage (currently at 76%)
- I would test concurrent task updates to check if the in-memory store handles them correctly
- I would add tests for filtering by status combined with pagination (e.g. `?status=todo&page=1&limit=5`) since the current route doesn't support both at once — that's a potential gap worth flagging
- I would test what happens when very large page numbers or negative values are passed to pagination

## Anything that surprised me in the codebase

- `completeTask()` was silently resetting `priority` to `'medium'` on every task completion — this is the kind of bug that would be very hard to catch without tests, since the API still returns a 200 response with no error
- `getByStatus()` was using `.includes()` instead of `===`, which means a partial string like `"do"` would match both `"todo"` and `"done"` — a subtle but serious data correctness bug
- `getPaginated()` used `page * limit` instead of `(page - 1) * limit`, meaning page 1 always skipped the first page of data entirely

## Questions I'd ask before shipping to production

- Should pagination and status filtering work together? Right now `?status=todo&page=1` ignores pagination entirely
- What should happen when `assignee` is reassigned — should it be allowed or blocked? Currently we allow overwriting
- Should `dueDate` in the past be rejected on creation, or only flagged as overdue in stats?
- There's no authentication — who should be allowed to delete or complete tasks?
- The data store is in-memory and resets on every server restart — is that intentional for production or should we add a database?
