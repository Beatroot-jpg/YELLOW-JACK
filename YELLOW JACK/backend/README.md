# Yellow Jack Backend API

Backend server for the Yellow Jack bar tracker system with username/password authentication.

## Features

- ✅ Username/password authentication (no Discord)
- ✅ Role-based access control (Staff, Manager, Admin)
- ✅ Sales tracking with 10% commission calculation
- ✅ Employee ledger system
- ✅ Roster management
- ✅ Blacklist functionality
- ✅ Payment history tracking
- ✅ PostgreSQL database

## Tech Stack

- **Node.js** + **Express.js** - Backend framework
- **PostgreSQL** - Database
- **bcrypt** - Password hashing
- **express-session** - Session management
- **CORS** - Cross-origin support

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up PostgreSQL Database

Install PostgreSQL if you haven't already, then create a database:

```sql
CREATE DATABASE yellow_jack;
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

Edit `.env`:
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=yellow_jack
PGUSER=postgres
PGPASSWORD=your_password

PORT=3000
NODE_ENV=development
SESSION_SECRET=generate_a_random_secret_here
```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will:
- Initialize database tables automatically
- Run on `http://localhost:3000`

### 5. Create First Admin User

The first user registered will automatically become an Admin. Use a tool like Postman or curl:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_secure_password",
    "full_name": "Admin User"
  }'
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/user` - Get current user

### Sales
- `GET /api/sales?page=1&limit=10` - Get sales (paginated)
- `POST /api/sales` - Create new sale
- `DELETE /api/sales/:id` - Delete sale (Manager/Admin)

### Ledger
- `GET /api/ledger` - Get employee ledger
- `POST /api/ledger/pay` - Record payment (Manager/Admin)

### Roster
- `GET /api/roster` - Get all roster members
- `POST /api/roster` - Add roster member (Manager/Admin)
- `PUT /api/roster/:id` - Update roster member (Manager/Admin)
- `DELETE /api/roster/:id` - Delete roster member (Manager/Admin)

### Blacklist
- `GET /api/blacklist` - Get blacklist
- `POST /api/blacklist` - Add to blacklist (Manager/Admin)
- `DELETE /api/blacklist/:id` - Remove from blacklist (Manager/Admin)

### Payments
- `GET /api/payments` - Get payment history

## Database Schema

### users
- Authentication and role management
- Roles: Staff, Manager, Admin

### roster
- Staff member records
- Status: Active, Inactive, On Leave

### sales
- Sales transactions
- Automatic 10%/90% split calculation

### employee_ledger
- Commission tracking per employee
- Auto-updated on sales

### payment_history
- Records when staff are paid

### blacklist
- Banned customers/individuals

## Role Permissions

### Staff
- View sales, roster, ledger
- Create sales
- View blacklist

### Manager
- All Staff permissions
- Delete sales
- Manage roster
- Manage blacklist
- Record payments

### Admin
- All Manager permissions
- Create new users
- Full system access

## Development

Run with auto-reload:
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `SESSION_SECRET`
3. Set up PostgreSQL on your hosting platform
4. Deploy to Railway, Heroku, or similar
5. Update `FRONTEND_URL` in CORS settings

## Notes

- First registered user becomes Admin automatically
- Sessions last 24 hours
- All passwords are hashed with bcrypt
- Database tables are created automatically on first run

