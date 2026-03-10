# Yellow Jack - Deployment Guide

This is the current deployment path for the app in its present structure.

## Active Deployment Split

- **Backend:** `backend/`
- **Frontend:** `frontend/`
- **Database:** PostgreSQL

Recommended setup:

- **Backend + DB:** Railway
- **Frontend:** Netlify

## 1. Deploy the Backend

Deploy the `backend/` directory to Railway.

Required environment variables:

- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `JWT_SECRET`
- `FRONTEND_URL`
- `NODE_ENV=production`

The backend health route is:

- `GET /`

## 2. Create the First Admin User

If the database has no users yet, create the first account with:

```bash
curl -X POST https://your-backend.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"change-me","full_name":"Admin User"}'
```

The first registered user becomes **Admin** automatically.

After the first user exists, `/auth/register` requires authenticated admin access.

## 3. Update Frontend Configuration

Edit:

- `frontend/config.js`

Set:

```javascript
const API_URL = 'https://your-backend.up.railway.app';
```

## 4. Deploy the Frontend

Deploy the **`frontend/` folder** as the static site root.

Important:

- do **not** deploy the repository root as the frontend app
- the active entry page is `index.html` inside `frontend/`

## 5. Configure CORS

Set Railway env var:

```text
FRONTEND_URL=https://your-frontend-domain.netlify.app
```

The value should exactly match the deployed frontend origin.

## 6. Verification Checklist

- [ ] Backend health route responds
- [ ] First admin user can be created if DB is empty
- [ ] Login works from `frontend/index.html`
- [ ] Dashboard loads after login
- [ ] Sales page can create sales
- [ ] Payroll page loads weekly summaries
- [ ] Admin page loads for admin users
- [ ] Logout works cleanly

## Common Issues

### CORS errors
Check `FRONTEND_URL` matches the deployed frontend origin exactly.

### Auth errors after login
Check `frontend/config.js` points at the correct backend URL.

### Frontend looks outdated after deploy
Make sure you deployed the `frontend/` directory and not an old root-level build.

### Backend starts but users cannot authenticate
Confirm `JWT_SECRET` is set in production.

## Related Docs

- `FRONTEND_SETUP.md`
- `backend/README.md`
- `backend/RAILWAY_DEPLOYMENT.md`
- `backend/SETUP_GUIDE.md`

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

