# Frontend Setup Guide

This repository already contains the active frontend application. Use this file as the current wiring reference rather than the older historical examples.

## Active Frontend App

The live frontend is the `frontend/` directory.

Key files:

- `frontend/index.html` - login page
- `frontend/dashboard.html` - landing page after login
- `frontend/config.js` - API base URL
- `frontend/shared.js` - auth + shared UI helpers
- `frontend/shared.css` - shared UI system

## API Configuration

Update the backend URL in:

- `frontend/config.js`

Example:

```javascript
const API_URL = 'https://your-backend-url.up.railway.app';
```

## Auth Model

The frontend uses JWT bearer auth.

On login it stores:

- `yj_token`
- `yj_user`

`frontend/shared.js` handles the common auth flow:

- bearer token injection via `apiFetch(...)`
- redirect to `index.html` on `401`
- queued toast message on session expiry

## Shared Frontend Helpers

Current shared helpers include:

- `apiFetch(...)`
- `getUser()`
- `showToast(...)`
- `showInlineMessage(...)`
- `fmtCurrency(...)`
- `createEmptyState(...)`
- `setButtonLoading(...)`

Use these instead of duplicating page-local helpers.

## Page Surface

- `index.html` - login
- `dashboard.html` - overview + quick access
- `analytics.html` - stats and leaderboards
- `sales.html` - sales, ledger, shifts
- `payroll.html` - weekly summary + shift log
- `roster.html` - roster CRUD
- `blacklist.html` - blacklist management
- `admin.html` - user management

## Local Testing

Serve the `frontend/` directory with a static server.

Example:

```bash
cd frontend
python -m http.server 8080
```

Then open:

- `http://localhost:8080/index.html`

## Deployment Notes

- Deploy the **`frontend/` folder** as the static site root
- Do not deploy the repo root as the active frontend
- Make sure `frontend/config.js` points at the correct backend
- Make sure backend `FRONTEND_URL` matches the deployed frontend origin

## First Admin Setup

If the database has no users yet:

1. call `POST /auth/register`
2. the first user becomes **Admin** automatically

After that, new user creation is intended to happen through authenticated admin access.

## Important Cleanup Notes

- old root-level frontend duplicates are no longer part of the app
- cookie/session-based examples are obsolete for Yellow Jack
- prefer shared helpers over page-specific utilities
- `DEVELOPMENT_REFERENCE.md` is historical reference material, not the current app contract


