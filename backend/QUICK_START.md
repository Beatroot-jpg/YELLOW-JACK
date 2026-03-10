# Quick Start - Get Yellow Jack Backend Running

## Step 1: Install PostgreSQL (Windows)

### Option A: Download Installer (Recommended)
1. Go to https://www.postgresql.org/download/windows/
2. Download the **PostgreSQL 16** installer
3. Run the installer:
   - Remember the password you set for the `postgres` user
   - Default port: **5432** (keep this)
   - Install pgAdmin 4 (GUI tool - very helpful)

### Option B: Check if Already Installed
Open PowerShell and run:
```powershell
psql --version
```
If you see a version number, PostgreSQL is already installed!

---

## Step 2: Create the Database

### Using pgAdmin (GUI - Easier):
1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Connect to your local server (use the password you set)
3. Right-click **Databases** → **Create** → **Database**
4. Name it: `yellow_jack`
5. Click **Save**

### Using Command Line:
```powershell
# Open PowerShell as Administrator
psql -U postgres

# You'll be prompted for the postgres password
# Then run:
CREATE DATABASE yellow_jack;

# Exit psql:
\q
```

---

## Step 3: Set Up Backend

### Install Node.js Dependencies
```powershell
cd "YELLOW JACK\backend"
npm install
```

### Create .env File
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```

Edit `.env` with Notepad and update:
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=yellow_jack
PGUSER=postgres
PGPASSWORD=YOUR_POSTGRES_PASSWORD_HERE

PORT=3000
NODE_ENV=development
JWT_SECRET=my_super_secret_key_change_in_production
```

**IMPORTANT:** Replace `YOUR_POSTGRES_PASSWORD_HERE` with the password you set during PostgreSQL installation!

---

## Step 4: Start the Backend Server

```powershell
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

If you see errors, check the **Troubleshooting** section below.

---

## Step 5: Create Your First Admin User

Open a **new PowerShell window** (keep the server running in the first one):

```powershell
curl -X POST http://localhost:3000/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\",\"full_name\":\"Admin User\"}'
```

You should get back:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "Admin User",
    "role": "Admin"
  }
}
```

---

## Step 6: Test the API

### Health Check:
```powershell
curl http://localhost:3000/
```

Should return:
```json
{"status":"ok","message":"Yellow Jack API is running"}
```

### Login:
```powershell
curl -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
```

---

## Troubleshooting

### Error: "Connection refused" or "ECONNREFUSED"
- PostgreSQL is not running
- **Fix:** Open **Services** (Windows key + R, type `services.msc`)
  - Find **postgresql-x64-16** (or similar)
  - Right-click → **Start**

### Error: "password authentication failed"
- Wrong password in `.env`
- **Fix:** Double-check `PGPASSWORD` in `.env` matches your PostgreSQL password

### Error: "database does not exist"
- Database not created
- **Fix:** Follow Step 2 again to create `yellow_jack` database

### Error: "Port 3000 already in use"
- Another app is using port 3000
- **Fix:** Change `PORT=3001` in `.env`

### Error: "npm: command not found"
- Node.js not installed
- **Fix:** Download from https://nodejs.org/ (LTS version)

---

## Next Steps

✅ Backend is running!
✅ Database is connected!
✅ Admin user created!

Now you can:
1. **Test API endpoints** using curl or Postman
2. **Point `frontend/config.js`** at the API
3. **Serve or deploy the `frontend/` app**

See `README.md` for full API documentation.

