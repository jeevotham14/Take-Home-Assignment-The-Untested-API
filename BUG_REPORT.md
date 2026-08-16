# Bug Report — Task Manager API

---

## Bug 1 — `getByStatus()` uses substring match instead of exact match

**File:** `src/services/taskService.js` — Line 7

**Expected behavior:**
`GET /tasks?status=todo` should return only tasks where `status === "todo"`

**Actual behavior:**
It uses `.includes()` which does a substring match.
So searching for `"do"` returns both `"todo"` and `"done"` tasks.

**How I discovered it:**
Wrote a unit test passing `"do"` as the status — it returned 2 tasks instead of 0.

**Buggy code:**
```js
const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));
```

**Fix:**
```js
const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

---

## Bug 2 — `getPaginated()` has wrong page offset (off-by-one)

**File:** `src/services/taskService.js` — Line 10

**Expected behavior:**
`GET /tasks?page=1&limit=2` should return the first 2 tasks (index 0 and 1).

**Actual behavior:**
`page=1` starts at index `1 * 2 = 2`, skipping the first 2 tasks entirely.
`page=1` behaves like `page=2`, and `page=2` returns nothing.

**How I discovered it:**
Wrote a unit test for `getPaginated(1, 2)` with 3 tasks — expected Task 1 but received Task 3.

**Buggy code:**
```js
const offset = page * limit;
```

**Fix:**
```js
const offset = (page - 1) * limit;
```

---

## Bug 3 — `completeTask()` silently resets priority to `'medium'`

**File:** `src/services/taskService.js` — Line 48

**Expected behavior:**
Completing a task should only set `status` to `"done"` and set `completedAt` timestamp.
The task's original `priority` should be preserved.

**Actual behavior:**
Every task that gets completed has its priority overwritten to `"medium"`,
regardless of what it was originally (`"high"` or `"low"`).

**How I discovered it:**
Created a `high` priority task, called `completeTask()`, and checked the result —
`priority` was `"medium"` instead of `"high"`.

**Buggy code:**
```js
const updated = {
  ...task,
  priority: 'medium',   // ← this line should not be here
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

**Fix:**
```js
const updated = {
  ...task,
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

---

## Summary

| # | Function | File | Bug | Fix |
|---|---------|------|-----|-----|
| 1 | `getByStatus()` | taskService.js | `.includes()` instead of `===` | Use strict equality |
| 2 | `getPaginated()` | taskService.js | `page * limit` skips first page | Use `(page - 1) * limit` |
| 3 | `completeTask()` | taskService.js | Priority reset to `'medium'` | Remove `priority: 'medium'` line |
