/**
 * Yellow Jack – Shared JS
 * Global auth wrapper: any 401 clears token and redirects to login.
 */

function apiFetch(url, options = {}) {
  const token = localStorage.getItem('yj_token');
  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${token}`
  };

  return fetch(url, { ...options, headers }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('yj_token');
      localStorage.removeItem('yj_user');
      window.location.href = 'index.html';
    }
    return res;
  });
}

/** Get the stored user object or redirect to login */
function getUser() {
  const token = localStorage.getItem('yj_token');
  const user = JSON.parse(localStorage.getItem('yj_user') || 'null');
  if (!token || !user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

