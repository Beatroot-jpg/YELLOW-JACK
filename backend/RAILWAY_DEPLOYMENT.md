# Railway Deployment Guide - Yellow Jack Backend

This guide will help you deploy the Yellow Jack backend to Railway with PostgreSQL database.

---

## 📋 Prerequisites

1. **GitHub Account** - https://github.com
2. **Railway Account** - https://railway.app (sign up with GitHub)
3. **Code pushed to GitHub** - Your backend code must be in a GitHub repository

---

## 🚀 Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to access your GitHub repositories
6. Select your **Yellow Jack** repository

---

## 🗄️ Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will automatically create a PostgreSQL database
5. Wait for it to deploy (~30 seconds)

**Important:** Railway automatically creates these environment variables:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port
- `PGDATABASE` - Database name
- `PGUSER` - Database user
- `PGPASSWORD` - Database password

---

## ⚙️ Step 3: Configure Backend Service

### 3.1 Set Root Directory (Important!)

Since your backend is in a subdirectory:

1. Click on your **backend service** (not the database)
2. Go to **"Settings"** tab
3. Scroll to **"Service Settings"**
4. Find **"Root Directory"**
5. Set it to: `YELLOW JACK/backend`
6. Click **"Update"**

### 3.2 Add Environment Variables

1. In your backend service, go to **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these variables one by one:

```bash
# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_random_string_here_change_this

# Frontend URL (we'll update this later when frontend is deployed)
FRONTEND_URL=http://localhost:8080

# Node Environment
NODE_ENV=production

# Port (Railway auto-assigns, but we can set default)
PORT=3000
```

**Note:** The database variables (`PGHOST`, `PGPORT`, etc.) are automatically set by Railway when you add PostgreSQL. You don't need to add them manually!

### 3.3 Verify Database Connection

Railway should automatically link your PostgreSQL database to your backend service. To verify:

1. Go to **"Variables"** tab
2. You should see variables like:
   - `DATABASE_URL`
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

If you don't see these, click **"+ New Variable"** → **"Add Reference"** → Select your PostgreSQL database.

---

## 🔧 Step 4: Configure Build & Start Commands

Railway should auto-detect your Node.js app, but let's verify:

1. Go to **"Settings"** tab
2. Scroll to **"Build & Deploy"**
3. Verify:
   - **Build Command:** `npm install` (auto-detected)
   - **Start Command:** `npm start` or `node server.js`

If not set, add them manually.

---

## 🚀 Step 5: Deploy!

1. Railway should automatically deploy after you configure everything
2. If not, click **"Deploy"** button
3. Watch the **"Deployments"** tab for progress
4. Wait for deployment to complete (~2-3 minutes)

You should see logs like:
```
✅ Connected to PostgreSQL database
🔄 Initializing database schema...
✅ Database schema initialized successfully
🚀 Yellow Jack API server running on port 3000
```

---

## 🌐 Step 6: Get Your Backend URL

1. In your backend service, go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Railway will give you a URL like:
   ```
   https://yellow-jack-production.up.railway.app
   ```
5. **Copy this URL** - you'll need it for the frontend!

---

## ✅ Step 7: Test Your Deployment

### Test Health Check:
```bash
curl https://your-railway-url.up.railway.app/
```

Should return:
```json
{"status":"ok","message":"Yellow Jack API is running"}
```

### Create First Admin User:
```bash
curl -X POST https://your-railway-url.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","full_name":"Admin User"}'
```

Should return:
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

## 🔄 Auto-Deploy from GitHub

Railway automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin main
   ```
3. Railway detects the push and auto-deploys
4. Check **"Deployments"** tab to watch progress

---

## 🐛 Troubleshooting

### Deployment Failed
- Check **"Deployments"** → Click failed deployment → View logs
- Common issues:
  - Missing `package.json` in root directory → Set **Root Directory** to `YELLOW JACK/backend`
  - Missing dependencies → Verify `package.json` is correct
  - Database not connected → Add PostgreSQL reference in Variables

### Database Connection Error
- Verify PostgreSQL service is running (green checkmark)
- Check that database variables are set in backend service
- Look for connection errors in deployment logs

### "Cannot find module" errors
- Make sure `npm install` runs during build
- Check that all dependencies are in `package.json`
- Verify **Root Directory** is set correctly

### Port Issues
- Railway automatically assigns a port via `PORT` environment variable
- Your `server.js` should use: `process.env.PORT || 3000`

---

## 📝 Next Steps

✅ Backend deployed to Railway
✅ PostgreSQL database connected
✅ Admin user created

Now you need to:
1. **Deploy the `frontend/` folder** (Netlify recommended)
2. **Update `FRONTEND_URL`** in Railway environment variables
3. **Set `frontend/config.js`** to your Railway backend URL

Your backend URL: `https://your-railway-url.up.railway.app`

Use this URL in `frontend/config.js`.

