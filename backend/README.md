# Yellow Jack Backend API

Express/PostgreSQL backend for the Yellow Jack operations tracker.

## Current Stack

- Node.js + Express
- PostgreSQL
- bcrypt for password hashing
- JWT for authentication
- CORS for frontend access control

## Current Environment Variables

```text
PGHOST=localhost
PGPORT=5432
PGDATABASE=yellow_jack
PGUSER=postgres
PGPASSWORD=your_password
PORT=3000
NODE_ENV=development
JWT_SECRET=generate_a_random_secret_here
FRONTEND_URL=http://localhost:8080
```

## Startup

```bash
cd backend
npm install
npm run dev
```

The server initializes its database tables on startup.

## Auth Notes

- The first registered user becomes **Admin** automatically.
- After the first user exists, `POST /auth/register` requires an authenticated **Admin**.
- Frontend clients send `Authorization: Bearer <token>`.

## Main Routes

### Health
- `GET /`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/check`
- `GET /auth/user`

### Analytics
- `GET /api/analytics/summary`

### Sales
- `GET /api/sales?page=1&limit=10`
- `POST /api/sales`
- `DELETE /api/sales/:id`

### Ledger / Payments
- `GET /api/ledger`
- `GET /api/ledger/:employee_name`
- `POST /api/ledger/pay`
- `GET /api/payments`

### Timesheets
- `GET /api/timesheets`
- `GET /api/timesheets/active`
- `GET /api/timesheets/weekly`
- `POST /api/timesheets/clock-in`
- `POST /api/timesheets/clock-out`

### Roster
- `GET /api/roster`
- `POST /api/roster`
- `PUT /api/roster/:id`
- `DELETE /api/roster/:id`

### Blacklist
- `GET /api/blacklist`
- `POST /api/blacklist`
- `DELETE /api/blacklist/:id`

### Users
- `GET /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

## Role Summary

- **Staff**: create/view sales, view operational data, use shift flows
- **Manager**: roster + blacklist management, ledger payments, sales deletion
- **Admin**: all manager permissions plus user management

## Deployment Notes

- Set a strong `JWT_SECRET`
- Set `FRONTEND_URL` to the deployed frontend origin
- Deploy `backend/` as the backend service
- Keep plaintext test credentials out of the repository

