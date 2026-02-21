# Frontend Setup Guide - Connecting to Railway Backend

This guide shows you how to connect your Yellow Jack frontend HTML pages to the Railway backend API.

---

## 📋 Overview

Your frontend needs to:
1. **Authenticate users** (login/logout)
2. **Fetch data** from the backend API
3. **Send data** to the backend API (create sales, update roster, etc.)
4. **Handle sessions** using localStorage (like the reference app)

---

## 🔧 Step 1: Update API Configuration

1. Open `YELLOW JACK/config.js`
2. Replace `your-railway-url.up.railway.app` with your actual Railway URL
3. Example:
   ```javascript
   const API_URL = 'https://yellow-jack-production.up.railway.app';
   ```

---

## 📝 Step 2: Add config.js to HTML Pages

Add this line to the `<head>` section of each HTML file:

```html
<script src="config.js"></script>
```

**Files to update:**
- `analytics.html`
- `sales.html`
- `payroll.html`
- `roster.html`
- `blacklist.html`
- `admin.html`

---

## 🔐 Step 3: Create Authentication System

Based on the reference app, we need to create a login page and auth functions.

### Create `login.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yellow Jack - Login</title>
  <script src="config.js"></script>
  <style>
    /* Add your monochrome theme styles here */
  </style>
</head>
<body>
  <div class="login-container">
    <img src="Main Logo.png" alt="Yellow Jack Logo" />
    <h1>Yellow Jack</h1>
    <form id="loginForm">
      <input type="text" id="username" placeholder="Username" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <div id="error-message"></div>
  </div>

  <script>
    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Store user data in localStorage (like reference app)
          localStorage.setItem('user', JSON.stringify(data.user));
          // Redirect to analytics page
          window.location.href = 'analytics.html';
        } else {
          document.getElementById('error-message').textContent = data.error;
        }
      } catch (error) {
        console.error('Login error:', error);
        document.getElementById('error-message').textContent = 'Login failed';
      }
    });
  </script>
</body>
</html>
```

---

## 🛡️ Step 4: Add Auth Check to All Pages

Add this script to the `<head>` or before `</body>` in each page:

```html
<script>
  // Check if user is logged in
  function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      // Not logged in, redirect to login page
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  // Logout function
  async function logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear localStorage
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = 'login.html';
  }

  // Run auth check on page load
  const currentUser = checkAuth();
  if (currentUser) {
    console.log('Logged in as:', currentUser.username, '- Role:', currentUser.role);
  }
</script>
```

---

## 📊 Step 5: Example - Load Sales Data

Here's how to fetch and display sales data on `sales.html`:

```javascript
// Add this script to sales.html
async function loadSales() {
  try {
    const response = await fetch(`${API_URL}/api/sales?page=1&limit=10`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      displaySales(data.sales);
    } else {
      console.error('Failed to load sales:', data.error);
    }
  } catch (error) {
    console.error('Error loading sales:', error);
  }
}

function displaySales(sales) {
  const tbody = document.querySelector('.sales-table tbody');
  tbody.innerHTML = ''; // Clear existing rows
  
  sales.forEach(sale => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sale.employee_name}</td>
      <td>${sale.description}</td>
      <td class="amount">$${parseFloat(sale.total_amount).toLocaleString()}</td>
      <td class="small">${sale.sale_date}</td>
      <td class="small">${sale.sale_time}</td>
      <td class="amount">$${parseFloat(sale.money_earnt).toLocaleString()}</td>
      <td class="amount">$${parseFloat(sale.business_made).toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
}

// Load sales when page loads
document.addEventListener('DOMContentLoaded', () => {
  checkAuth(); // Make sure user is logged in
  loadSales(); // Load sales data
});
```

---

## ✍️ Step 6: Example - Create New Sale

```javascript
// Add this to sales.html form submit handler
document.querySelector('.sale-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const employee_name = document.getElementById('sale-employee').value;
  const description = document.getElementById('sale-description').value;
  const total_amount = document.getElementById('sale-amount').value;
  
  try {
    const response = await fetch(`${API_URL}/api/sales`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_name, description, total_amount })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Sale created successfully!');
      loadSales(); // Reload sales table
      e.target.reset(); // Clear form
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error creating sale:', error);
    alert('Failed to create sale');
  }
});
```

---

## 🎯 Complete Integration Checklist

- [ ] Deploy backend to Railway
- [ ] Get Railway URL
- [ ] Update `config.js` with Railway URL
- [ ] Add `<script src="config.js"></script>` to all HTML pages
- [ ] Create `login.html` page
- [ ] Add auth check script to all pages
- [ ] Add logout button to sidebar
- [ ] Implement data loading for each page:
  - [ ] Analytics - Load sales stats, leaderboards
  - [ ] Sales - Load sales history, create new sales
  - [ ] Payroll - Load ledger, record payments
  - [ ] Roster - Load roster, CRUD operations
  - [ ] Blacklist - Load blacklist, add/remove entries
  - [ ] Admin - User management

---

## 📚 Reference

See `DEVELOPMENT_REFERENCE.md` for complete examples from Los Santos Sanitation app, including:
- Token-based authentication (lines 1172-1219)
- Loading data on page load (lines 1353-1373)
- API call patterns (lines 1274-1418)
- localStorage usage (lines 1206-1212)

---

## 🚀 Next Steps

1. **Deploy backend to Railway** (follow `RAILWAY_DEPLOYMENT.md`)
2. **Update `config.js`** with your Railway URL
3. **Create login page** using the template above
4. **Add auth checks** to all pages
5. **Implement data loading** for each page
6. **Test everything** locally first
7. **Deploy frontend** to Netlify or Railway static hosting


