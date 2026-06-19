// ===========================
// TaskFlow — API & Auth Utils
// ===========================

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
  ? 'http://localhost:5000/api'
  : '/api'; // same origin on deployment

// ---- Token management ----
const Auth = {
  getToken: () => localStorage.getItem('tf_token'),
  setToken: (t) => localStorage.setItem('tf_token', t),
  removeToken: () => localStorage.removeItem('tf_token'),

  getUser: () => {
    try { return JSON.parse(localStorage.getItem('tf_user')); }
    catch { return null; }
  },
  setUser: (u) => localStorage.setItem('tf_user', JSON.stringify(u)),
  removeUser: () => localStorage.removeItem('tf_user'),

  isLoggedIn: () => !!localStorage.getItem('tf_token'),

  logout: () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_last_filter');
    window.location.href = '/login.html';
  }
};

// ---- Core fetch wrapper ----
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      Auth.logout();
      return;
    }
    const err = new Error(data.message || 'Request failed');
    err.errors = data.errors || [];
    err.status = res.status;
    throw err;
  }

  return data;
}

// ---- Convenience methods ----
const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
};

// ---- Toast Notifications ----
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="font-size:1rem">${icons[type] || 'ℹ'}</span>
      <span style="flex:1">${message}</span>
      <button onclick="this.parentElement.remove()" style="opacity:.5;font-size:.8rem;padding:2px 4px">✕</button>
    `;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  success: (m) => Toast.show(m, 'success'),
  error: (m) => Toast.show(m, 'error', 5000),
  info: (m) => Toast.show(m, 'info'),
  warning: (m) => Toast.show(m, 'warning'),
};

// ---- Theme management ----
const Theme = {
  get: () => localStorage.getItem('tf_theme') || 'light',
  set(theme) {
    localStorage.setItem('tf_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const user = Auth.getUser();
    if (user) {
      user.preferences = user.preferences || {};
      user.preferences.theme = theme;
      Auth.setUser(user);
    }
  },
  toggle() {
    const next = this.get() === 'light' ? 'dark' : 'light';
    this.set(next);
    return next;
  },
  init() {
    const saved = this.get();
    document.documentElement.setAttribute('data-theme', saved);
  }
};

// ---- Helpers ----
function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date() ;
}

function relativeDate(d) {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const diff = Math.round((date - now) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1) return `${Math.abs(diff)}d overdue`;
  if (diff < 7) return `In ${diff} days`;
  return formatDate(d);
}

function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/login.html';
  }
}

function redirectIfLoggedIn() {
  if (Auth.isLoggedIn()) {
    window.location.href = '/index.html';
  }
}

// Sidebar toggle
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const hamburger = document.querySelector('.hamburger');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('visible');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }
}

// Populate sidebar user info
function initSidebarUser() {
  const user = Auth.getUser();
  if (!user) return;

  const nameEl = document.getElementById('sidebar-user-name');
  const emailEl = document.getElementById('sidebar-user-email');
  const avatarEl = document.getElementById('sidebar-avatar');

  if (nameEl) nameEl.textContent = user.name || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
  if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
}

// Theme toggle button init
function initThemeToggle() {
  Theme.init();
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const update = () => btn.textContent = Theme.get() === 'dark' ? '☀️' : '🌙';
  update();
  btn.addEventListener('click', () => { Theme.toggle(); update(); });
}

// Active nav item
function setActiveNav(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// Save/load last filter state to localStorage
const FilterState = {
  key: 'tf_last_filter',
  save(state) { localStorage.setItem(this.key, JSON.stringify(state)); },
  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
    catch { return {}; }
  }
};
