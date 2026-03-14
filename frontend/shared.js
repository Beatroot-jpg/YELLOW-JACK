/**
 * Yellow Jack – Shared JS
 * Global auth wrapper + shared UI helpers.
 */

const YJ_TOAST_QUEUE_KEY = 'yj_toast_queue';
const YJ_REDIRECT_FLAG = '__yj_redirecting__';
const YJ_ADMIN_ROLES = ['Admin', 'Owner'];
const YJ_ANALYTICS_ROLES = ['Manager', 'Admin', 'Owner'];
const YJ_SYNC_CHANNEL = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('yellow-jack-sync')
  : null;

function ensureToastRoot() {
  let root = document.getElementById('toastStack');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toastStack';
    root.className = 'toast-stack';
    document.body.appendChild(root);
  }
  return root;
}

function queueToast(type, message, title = '') {
  sessionStorage.setItem(YJ_TOAST_QUEUE_KEY, JSON.stringify({ type, message, title }));
}

function showToast(type, message, options = {}) {
  const root = ensureToastRoot();
  const iconMap = { success: '✓', error: '!', warning: '⚠', info: 'i' };
  const titleMap = { success: 'Success', error: 'Error', warning: 'Notice', info: 'Update' };
  const toast = document.createElement('div');
  const resolvedTitle = options.title || titleMap[type] || 'Notice';
  const duration = options.duration ?? (type === 'error' ? 4800 : 3600);

  toast.className = `toast toast--${type || 'info'}`;
  toast.innerHTML = `
    <div class="toast__icon">${iconMap[type] || 'i'}</div>
    <div>
      <div class="toast__title">${resolvedTitle}</div>
      <div class="toast__message">${message}</div>
    </div>
    <button type="button" class="toast__close" aria-label="Dismiss">×</button>
  `;

  const close = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    setTimeout(() => toast.remove(), 180);
  };

  toast.querySelector('.toast__close').addEventListener('click', close);
  root.appendChild(toast);
  setTimeout(close, duration);
  return toast;
}

function consumeQueuedToast() {
  const raw = sessionStorage.getItem(YJ_TOAST_QUEUE_KEY);
  if (!raw) return;
  sessionStorage.removeItem(YJ_TOAST_QUEUE_KEY);
  try {
    const toast = JSON.parse(raw);
    showToast(toast.type, toast.message, { title: toast.title });
  } catch {
    // no-op
  }
}

function createEmptyState({ icon = '•', title = 'Nothing here yet', description = 'There is no data to show right now.', actionLabel = '', actionHref = '', actionClass = 'button-primary', compact = false } = {}) {
  const actionMarkup = actionLabel && actionHref
    ? `<div class="empty-state__actions"><a href="${actionHref}" class="${actionClass} empty-state__action">${actionLabel}</a></div>`
    : '';
  return `
    <div class="empty-state ${compact ? 'empty-state--compact' : ''}">
      <div class="empty-state__icon">${icon}</div>
      <div class="empty-state__title">${title}</div>
      <div class="empty-state__desc">${description}</div>
      ${actionMarkup}
    </div>
  `;
}

function createTableSkeleton(columnCount = 4, rowCount = 5) {
  return Array.from({ length: rowCount }, () => `
    <tr>
      <td colspan="${columnCount}" style="padding:0">
        <div class="skeleton-table-row" style="grid-template-columns: repeat(${columnCount}, minmax(0, 1fr));">
          ${Array.from({ length: columnCount }, (_, i) => `<div class="skeleton skeleton-line ${i === 0 ? 'skeleton-line--lg' : i === columnCount - 1 ? 'skeleton-line--sm' : 'skeleton-line--md'}"></div>`).join('')}
        </div>
      </td>
    </tr>`).join('');
}

function createListSkeleton(itemCount = 4) {
  return Array.from({ length: itemCount }, () => `
    <li class="skeleton-list-item">
      <div class="skeleton skeleton-line skeleton-line--md"></div>
      <div class="skeleton skeleton-line skeleton-line--lg"></div>
    </li>`).join('');
}

function createActiveShiftSkeleton(itemCount = 3) {
  return Array.from({ length: itemCount }, () => `
    <div class="skeleton-list-item">
      <div class="skeleton skeleton-line skeleton-line--md"></div>
      <div class="skeleton skeleton-line skeleton-line--sm"></div>
    </div>`).join('');
}

function fmtCurrency(value) {
  return '$' + Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function isAdminRole(role) {
  return YJ_ADMIN_ROLES.includes(role);
}

function canAccessAdmin(user = null) {
  const resolvedUser = user || JSON.parse(localStorage.getItem('yj_user') || 'null');
  return isAdminRole(resolvedUser?.role);
}

function canAccessAnalytics(user = null) {
  const resolvedUser = user || JSON.parse(localStorage.getItem('yj_user') || 'null');
  return YJ_ANALYTICS_ROLES.includes(resolvedUser?.role);
}

function applyRoleVisibility() {
  if (!canAccessAdmin()) {
    document.querySelectorAll('a[href="admin.html"]').forEach(el => {
      el.style.display = 'none';
    });
  }

  if (!canAccessAnalytics()) {
    document.querySelectorAll('a[href="analytics.html"]').forEach(el => {
      el.style.display = 'none';
    });
  }
}

function showInlineMessage(target, text, ok = true, duration = 4000) {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  el.textContent = text;
  el.className = `ui-message ${ok ? 'ui-message--success' : 'ui-message--error'}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, duration);
}

function setButtonLoading(button, isLoading, loadingText = 'Working...') {
  if (!button) return;
  if (isLoading) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add('is-loading');
    button.innerHTML = `<span class="button-loading__spinner"></span><span>${loadingText}</span>`;
    return;
  }

  button.disabled = false;
  button.classList.remove('is-loading');
  if (button.dataset.originalLabel) {
    button.innerHTML = button.dataset.originalLabel;
  }
}

function broadcastAppEvent(type, payload = {}) {
  if (!YJ_SYNC_CHANNEL) return;
  YJ_SYNC_CHANNEL.postMessage({ type, payload, ts: Date.now() });
}

function subscribeAppEvent(type, handler) {
  if (!YJ_SYNC_CHANNEL || typeof handler !== 'function') {
    return () => {};
  }

  const listener = (event) => {
    if (event.data?.type === type) {
      handler(event.data.payload || {});
    }
  };

  YJ_SYNC_CHANNEL.addEventListener('message', listener);
  return () => YJ_SYNC_CHANNEL.removeEventListener('message', listener);
}

function apiFetch(url, options = {}) {
  const token = localStorage.getItem('yj_token');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  return fetch(url, { ...options, headers }).then(res => {
    if (res.status === 401) {
      queueToast('warning', 'Your session expired. Please sign in again.', 'Session Expired');
      localStorage.removeItem('yj_token');
      localStorage.removeItem('yj_user');
      if (!window[YJ_REDIRECT_FLAG]) {
        window[YJ_REDIRECT_FLAG] = true;
        window.location.href = 'index.html';
      }
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    consumeQueuedToast();
    applyRoleVisibility();
  }, { once: true });
} else {
  consumeQueuedToast();
  applyRoleVisibility();
}

