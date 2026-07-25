/* ═══════════════════════════════════════════
   XUNSHE common.js — 公共交互逻辑
   ═══════════════════════════════════════════ */

const API_BASE = '/api';

// ── DOM 就绪 ──
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  highlightCurrentNav();
});

// ── 导航栏滚动毛玻璃效果 + 移动端菜单 ──
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!navbar) return;

  // 滚动效果
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 50;
        navbar.classList.toggle('scrolled', scrolled);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  // 初始状态
  if (window.scrollY > 50) navbar.classList.add('scrolled');

  // 移动端菜单
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // 点击导航链接关闭菜单
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
}

// ── 高亮当前页面导航 ──
function highlightCurrentNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ── 滚动入场动画 ──
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });
}

// ── API 请求封装 ──
const API = {
  async get(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullUrl = `${API_BASE}${url}${query ? '?' + query : ''}`;
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async post(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async put(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async del(url) {
    const res = await fetch(`${API_BASE}${url}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async uploadFile(url, file, fieldName = 'file') {
    const formData = new FormData();
    formData.append(fieldName, file);
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // 需要认证的请求
  async authGet(url, params = {}) {
    const query = new URLSearchParams(params).toString();
    const fullUrl = `${API_BASE}${url}${query ? '?' + query : ''}`;
    const res = await fetch(fullUrl, { headers: this._authHeaders() });
    if (res.status === 401) { this._promptAuth(); throw new Error('需要认证'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async authPost(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { ...this._authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.status === 401) { this._promptAuth(); throw new Error('需要认证'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async authPut(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: { ...this._authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.status === 401) { this._promptAuth(); throw new Error('需要认证'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async authDel(url) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: this._authHeaders()
    });
    if (res.status === 401) { this._promptAuth(); throw new Error('需要认证'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async authUpload(url, file, fieldName = 'file') {
    const formData = new FormData();
    formData.append(fieldName, file);
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: formData
    });
    if (res.status === 401) { this._promptAuth(); throw new Error('需要认证'); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  _authHeaders() {
    const token = sessionStorage.getItem('xunshe-auth');
    if (!token) return {};
    return { 'Authorization': 'Basic ' + token };
  },

  _promptAuth() {
    const user = prompt('请输入管理员用户名:');
    if (!user) return;
    const pass = prompt('请输入管理员密码:');
    if (!pass) return;
    const token = btoa(user + ':' + pass);
    sessionStorage.setItem('xunshe-auth', token);
  }
};

// ── 工具函数 ──
function getLangField(item, field) {
  const lang = (window.I18N && I18N.current) || 'zh-CN';
  if (lang === 'en' && item[field + 'En']) return item[field + 'En'];
  if (lang === 'zh-TC' && item[field + 'Tc']) return item[field + 'Tc'];
  return item[field] || '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ── Toast 提示 ──
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 12px 24px; border-radius: 8px; font-size: 0.9rem;
    color: #fff; animation: slideDown 0.3s ease;
    background: ${type === 'error' ? '#ff0015' : type === 'success' ? '#2ecc71' : '#1a1a26'};
    border: 1px solid ${type === 'error' ? '#ff0015' : type === 'success' ? '#2ecc71' : 'rgba(255,255,255,0.1)'};
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// 暴露到全局
window.API = API;
window.getLangField = getLangField;
window.formatDate = formatDate;
window.showToast = showToast;
