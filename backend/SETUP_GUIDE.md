# Yellow Jack Backend - Quick Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)

## Step-by-Step Setup

### 1. Install PostgreSQL

**Windows:**
- Download PostgreSQL installer
- During installation, remember your postgres password
- Default port is 5432

**Mac (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Open PostgreSQL command line (psql) or use pgAdmin:

```sql
CREATE DATABASE yellow_jack;
```

Or from command line:
```bash
# Windows
psql -U postgres
CREATE DATABASE yellow_jack;
\q

# Mac/Linux
sudo -u postgres psql
CREATE DATABASE yellow_jack;
\q
```

### 3. Install Node Dependencies

```bash
cd "YELLOW JACK/backend"
npm install
```

### 4. Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=yellow_jack
PGUSER=postgres
PGPASSWORD=YOUR_POSTGRES_PASSWORD_HERE

PORT=3000
NODE_ENV=development
SESSION_SECRET=change_this_to_a_random_string_in_production
```

### 5. Start the Server

```bash
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
🔄 Initializing database schema...
✅ Database schema initialized successfully
🚀 Yellow Jack API server running on port 3000
📍 Environment: development
```

### 6. Create Your First Admin User

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"full_name\":\"Admin User\"}"
```

Or use Postman/Insomnia:
- Method: POST
- URL: `http://localhost:3000/auth/register`
- Body (JSON):
```json
{
  "username": "admin",
  "password": "admin123",
  "full_name": "Admin User"
}
```

### 7. Test Login

```bash
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

You should get back:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "Admin User",
    "role": "Admin"
  }
}
```

## Troubleshooting

### "Connection refused" error
- Make sure PostgreSQL is running
- Check your PGHOST and PGPORT in `.env`

### "password authentication failed"
- Double-check your PGPASSWORD in `.env`
- Make sure it matches your PostgreSQL password

### "database does not exist"
- Create the database: `CREATE DATABASE yellow_jack;`

### Port 3000 already in use
- Change PORT in `.env` to another number (e.g., 3001)

## Next Steps

1. ✅ Backend is running
2. Connect your frontend HTML files to the API
3. Update frontend JavaScript to call these endpoints
4. Test sales creation, roster management, etc.

## API Testing

Use the health check endpoint to verify the server is running:
```bash
curl http://localhost:3000/
```

Should return:
```json
{
  "status": "ok",
  "message": "Yellow Jack API is running"
}
```

## Database Management

View your data using:
- **pgAdmin** (GUI tool, comes with PostgreSQL)
- **psql** (command line)
- **DBeaver** (free universal database tool)

Connect with:
- Host: localhost
- Port: 5432
- Database: yellow_jack
- User: postgres
- Password: (your postgres password)

