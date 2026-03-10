# Yellow Jack - Bar Tracker System

Yellow Jack is a full-stack operations tracker for venue sales, staff shifts, payroll visibility, roster management, blacklist records, and admin access control.

## Overview

- **Frontend:** static app in `frontend/`
- **Backend:** Node/Express API in `backend/`
- **Database:** PostgreSQL
- **Auth:** username/password + JWT
- **Deployment:** Railway (backend/database) + Netlify or similar static host (frontend)

## Core Features

- Sales logging with automatic 10% / 90% split
- Employee ledger and payment history
- Timesheets with clock in / clock out support
- Weekly payroll summary view
- Staff roster CRUD
- Blacklist management
- Admin-only user management
- Shared UI layer for toasts, skeleton loading, empty states, and layout patterns

## Current Project Structure

```text
YELLOW JACK/
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── analytics.html
│   ├── sales.html
│   ├── payroll.html
│   ├── roster.html
│   ├── blacklist.html
│   ├── admin.html
│   ├── config.js
│   ├── shared.js
│   └── shared.css
├── backend/
│   ├── server.js
│   ├── database.js
│   ├── package.json
│   ├── .env.example
│   └── *.md
├── README.md
├── DEPLOYMENT_GUIDE.md
└── FRONTEND_SETUP.md
```

## Quick Start

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set your PostgreSQL values, plus:

- `JWT_SECRET`
- `FRONTEND_URL`

### 3. Start the backend

```bash
cd backend
npm run dev
```

### 4. Point the frontend at the backend

Edit:

- `frontend/config.js`

Set `API_URL` to your local or deployed backend URL.

### 5. Run the frontend

Serve the `frontend/` directory with any static server, or deploy that folder directly to Netlify.

Entry page:

- `frontend/index.html`

## Authentication Model

- First registered user becomes **Admin** automatically
- After that, only authenticated **Admins** can create new users
- Frontend stores `yj_token` and `yj_user` in `localStorage`
- Shared auth logic lives in `frontend/shared.js`

## Role Summary

- **Staff** - view data, create sales, use shift clock
- **Manager** - all Staff permissions + roster/blacklist management + pay ledger entries
- **Admin** - all Manager permissions + user management

## Main API Groups

- `/auth/*`
- `/api/sales`
- `/api/analytics/summary`
- `/api/ledger`
- `/api/timesheets`
- `/api/roster`
- `/api/blacklist`
- `/api/users`

See `backend/README.md` for the endpoint list.

## Documentation

- `DEPLOYMENT_GUIDE.md` - current deployment path
- `FRONTEND_SETUP.md` - frontend wiring notes
- `backend/README.md` - backend/API overview
- `backend/SETUP_GUIDE.md` - backend local setup
- `backend/RAILWAY_DEPLOYMENT.md` - Railway backend deployment notes

## Notes

- The active frontend lives in `frontend/`
- Old root-level duplicate frontend files have been removed
- Local credential/test payload files should stay out of the repo

## License

Private project. Not licensed for public distribution.

