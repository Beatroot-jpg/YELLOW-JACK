# Yellow Jack - Bar Tracker System

A comprehensive full-stack web application for managing Yellow Jack bar operations, including sales tracking, employee commissions, roster management, and blacklist functionality.

## 🎯 Features

- **Sales Tracking** - Record and manage bar sales with automatic 10%/90% commission split
- **Employee Ledger** - Automatic commission tracking per employee
- **Roster Management** - Track staff members, ranks, and status
- **Blacklist System** - Manage banned customers
- **Payment History** - Record when staff are paid
- **Role-Based Access** - Staff, Manager, and Admin tiers
- **Username/Password Authentication** - Secure login system

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)  →  Backend (Node.js/Express)  →  PostgreSQL Database
```

- **Frontend:** Vanilla HTML/CSS/JavaScript (no frameworks)
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (6 tables)
- **Authentication:** Username/password with bcrypt hashing
- **Deployment:** Railway (backend + database) + Netlify (frontend)

## 📊 Database Schema

- **users** - Authentication and role management
- **roster** - Staff member records
- **sales** - Sales transactions with automatic commission calculation
- **employee_ledger** - Commission tracking (auto-updated)
- **payment_history** - Payment records
- **blacklist** - Banned individuals

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- Railway account (for deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE yellow_jack;
   ```

3. **Configure environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your database credentials
   ```

4. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

5. **Open frontend:**
   - Open `analytics.html` in your browser
   - Or serve with a local server

### Deployment to Railway

See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for complete deployment instructions.

**Quick steps:**
1. Deploy backend to Railway
2. Add PostgreSQL database
3. Configure environment variables
4. Deploy frontend to Netlify
5. Update `config.js` with Railway URL

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment walkthrough
- **[backend/RAILWAY_DEPLOYMENT.md](backend/RAILWAY_DEPLOYMENT.md)** - Railway setup guide
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Frontend integration guide
- **[backend/README.md](backend/README.md)** - API documentation
- **[backend/SETUP_GUIDE.md](backend/SETUP_GUIDE.md)** - Local setup instructions

## 🔐 Authentication

Yellow Jack uses username/password authentication (no Discord OAuth).

**Default first user:**
- The first registered user automatically becomes an Admin
- Use the `/auth/register` endpoint to create the first user

**Role Permissions:**
- **Staff** - View data, create sales
- **Manager** - Delete sales, manage roster/blacklist, record payments
- **Admin** - Full access + create users

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3 (monochrome grey/white/black theme)
- Vanilla JavaScript
- localStorage for session management

### Backend
- Node.js
- Express.js
- PostgreSQL (pg client)
- bcrypt (password hashing)
- express-session (session management)
- CORS (cross-origin support)

### Deployment
- **Backend:** Railway
- **Database:** Railway PostgreSQL
- **Frontend:** Netlify (or Railway static hosting)

## 📁 Project Structure

```
YELLOW JACK/
├── analytics.html          # Analytics dashboard
├── sales.html              # Sales tracking page
├── payroll.html            # Payroll management
├── roster.html             # Staff roster
├── blacklist.html          # Blacklist management
├── admin.html              # Admin panel
├── config.js               # API configuration
├── Main Logo.png           # Logo asset
├── DEPLOYMENT_GUIDE.md     # Deployment instructions
├── FRONTEND_SETUP.md       # Frontend integration guide
└── backend/
    ├── server.js           # Express server + API routes
    ├── database.js         # PostgreSQL schema
    ├── package.json        # Dependencies
    ├── .env.example        # Environment template
    ├── README.md           # API documentation
    ├── RAILWAY_DEPLOYMENT.md
    └── SETUP_GUIDE.md
```

## 🔗 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/user` - Get current user

### Sales
- `GET /api/sales` - Get sales (paginated)
- `POST /api/sales` - Create sale
- `DELETE /api/sales/:id` - Delete sale (Manager/Admin)

### Ledger
- `GET /api/ledger` - Get employee ledger
- `POST /api/ledger/pay` - Record payment (Manager/Admin)

### Roster
- `GET /api/roster` - Get roster
- `POST /api/roster` - Add member (Manager/Admin)
- `PUT /api/roster/:id` - Update member (Manager/Admin)
- `DELETE /api/roster/:id` - Delete member (Manager/Admin)

### Blacklist
- `GET /api/blacklist` - Get blacklist
- `POST /api/blacklist` - Add entry (Manager/Admin)
- `DELETE /api/blacklist/:id` - Remove entry (Manager/Admin)

See [backend/README.md](backend/README.md) for complete API documentation.

## 🎨 Design

**Color Scheme:** Monochrome (grey/white/black)
- Professional, business-minded aesthetic
- Bold, uppercase headings
- Card-based layout
- Sidebar navigation

## 📝 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

Conceptually inspired by Los Santos Sanitation tracker system.

