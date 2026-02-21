# Yellow Jack - Complete Deployment Guide

This is your master guide for deploying Yellow Jack to Railway (backend + database) and connecting the frontend.

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                            │
│                 (Username/Password Login)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (HTML/CSS/JS)                      │
│              (Netlify or Railway Static)                     │
│                                                              │
│  • Static HTML/CSS/JS files                                 │
│  • Login page with username/password                        │
│  • localStorage for session management                      │
│  • API calls to Railway backend                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls (CORS enabled)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   RAILWAY (Backend)                          │
│         yellow-jack-production.up.railway.app               │
│                                                              │
│  • Node.js Express server                                   │
│  • Username/password authentication                         │
│  • API endpoints (sales, roster, ledger, etc.)             │
│  • Session management                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Database queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              RAILWAY POSTGRESQL (Database)                   │
│                                                              │
│  • 6 tables (users, sales, roster, ledger, etc.)           │
│  • Automatic backups                                         │
│  • Connection pooling                                        │
│  • SSL enabled                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Railway account (sign up at https://railway.app with GitHub)
- [x] Code ready in GitHub repository

---

## 🚀 Deployment Steps

### **STEP 1: Deploy Backend to Railway** ⏱️ ~10 minutes

Follow the detailed guide: **`backend/RAILWAY_DEPLOYMENT.md`**

**Quick Summary:**
1. Create new Railway project
2. Deploy from GitHub repo
3. Add PostgreSQL database
4. Set root directory to `YELLOW JACK/backend`
5. Configure environment variables:
   - `SESSION_SECRET` (random string)
   - `FRONTEND_URL` (update later)
   - `NODE_ENV=production`
6. Generate domain (get your Railway URL)
7. Test deployment with health check

**Result:** Backend running at `https://your-app.up.railway.app`

---

### **STEP 2: Test Backend & Create Admin User** ⏱️ ~5 minutes

```bash
# Test health check
curl https://your-railway-url.up.railway.app/

# Create first admin user
curl -X POST https://your-railway-url.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","full_name":"Admin User"}'

# Test login
curl -X POST https://your-railway-url.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Result:** Admin user created, backend API working

---

### **STEP 3: Update Frontend Configuration** ⏱️ ~2 minutes

1. Open `YELLOW JACK/config.js`
2. Replace the URL:
   ```javascript
   const API_URL = 'https://your-actual-railway-url.up.railway.app';
   ```
3. Save the file

**Result:** Frontend knows where to call the backend

---

### **STEP 4: Connect Frontend to Backend** ⏱️ ~30 minutes

Follow the detailed guide: **`FRONTEND_SETUP.md`**

**Quick Summary:**
1. Add `<script src="config.js"></script>` to all HTML pages
2. Create `login.html` page
3. Add authentication check to all pages
4. Add logout functionality
5. Implement data loading for each page:
   - Analytics: Load sales stats
   - Sales: Load/create sales
   - Payroll: Load ledger, record payments
   - Roster: CRUD operations
   - Blacklist: Add/remove entries
   - Admin: User management

**Result:** Frontend can communicate with backend

---

### **STEP 5: Deploy Frontend** ⏱️ ~5 minutes

**Option A: Netlify (Recommended)**
1. Go to https://netlify.com
2. Drag & drop your `YELLOW JACK` folder
3. Or connect GitHub repo for auto-deploy
4. Get your Netlify URL (e.g., `https://yellow-jack.netlify.app`)

**Option B: Railway Static Hosting**
1. In Railway project, click "+ New"
2. Select "Empty Service"
3. Connect to GitHub repo
4. Set root directory to `YELLOW JACK`
5. Railway will serve static files

**Result:** Frontend deployed and accessible

---

### **STEP 6: Update CORS Settings** ⏱️ ~2 minutes

1. Go to Railway dashboard
2. Open your backend service
3. Go to "Variables" tab
4. Update `FRONTEND_URL` to your actual frontend URL:
   ```
   FRONTEND_URL=https://yellow-jack.netlify.app
   ```
5. Railway will auto-redeploy

**Result:** CORS configured, frontend can call backend

---

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] Backend health check returns `{"status":"ok"}`
- [ ] Can create admin user via API
- [ ] Can login via API
- [ ] Frontend loads without errors
- [ ] Login page works
- [ ] After login, redirects to analytics page
- [ ] Can create a sale
- [ ] Sales appear in sales history
- [ ] Ledger updates automatically
- [ ] Can view roster
- [ ] Can add to blacklist
- [ ] Logout works

---

## 🐛 Common Issues & Solutions

### "CORS Error" in browser console
**Solution:** Update `FRONTEND_URL` in Railway to match your frontend URL exactly (no trailing slash)

### "Authentication required" errors
**Solution:** Make sure `credentials: 'include'` is in all fetch requests

### "Cannot find module" on Railway
**Solution:** Verify root directory is set to `YELLOW JACK/backend`

### Database connection fails
**Solution:** Check that PostgreSQL service is running in Railway

### Session not persisting
**Solution:** Check that user data is being saved to localStorage after login

---

## 📚 Documentation Files

- **`backend/RAILWAY_DEPLOYMENT.md`** - Detailed Railway setup
- **`FRONTEND_SETUP.md`** - Frontend integration guide
- **`backend/README.md`** - API documentation
- **`backend/SETUP_GUIDE.md`** - Local development setup
- **`DEVELOPMENT_REFERENCE.md`** - Los Santos Sanitation reference

---

## 🎉 You're Done!

Once all steps are complete, you'll have:

✅ Backend deployed to Railway
✅ PostgreSQL database connected
✅ Frontend deployed (Netlify or Railway)
✅ Full authentication system
✅ All features working end-to-end

**Your live URLs:**
- Frontend: `https://your-frontend-url`
- Backend API: `https://your-railway-url.up.railway.app`

---

## 🔄 Making Updates

### Update Backend:
```bash
git add backend/
git commit -m "Update backend"
git push origin main
```
Railway auto-deploys in ~2 minutes

### Update Frontend:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Netlify auto-deploys in ~1 minute

---

## 📞 Need Help?

1. Check Railway logs for backend errors
2. Check browser console (F12) for frontend errors
3. Review `DEVELOPMENT_REFERENCE.md` for examples
4. Test API endpoints with curl or Postman

Good luck! 🚀

