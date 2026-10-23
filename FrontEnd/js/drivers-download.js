/* ═══════════════════════════════════════════
   XUNSHE drivers-download.js — 客户端下载页
   数据来源：/api/content/drivers（数据库 Driver 集合）
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  const CATEGORY_ORDER = ['keyboard', 'mouse', 'headphone'];
  const CATEGORY_ICON = {
    keyboard: '/ICON/键盘.svg',
    mouse: '/ICON/鼠标.svg',
    headphone: '/ICON/耳机.svg'
  };
  const CATEGORY_I18N = {
    keyboard: 'drivers.downloadPage.category.keyboard',
    mouse: 'drivers.downloadPage.category.mouse',
    headphone: 'drivers.downloadPage.category.headphone'
  };

  const t = key => (window.I18N && typeof window.I18N.t === 'function')
    ? window.I18N.t(key)
    : key;

  let container = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function translated(tag, className, key) {
    const node = el(tag, className, t(key));
    node.dataset.i18n = key;
    return node;
  }

  function normalizeItems(rawItems) {
    return (Array.isArray(rawItems) ? rawItems : [])
      .map(item => ({
        id: item && item._id ? String(item._id) : '',
        name: (item && item.name) || '',
        category: (item && item.category) || '',
        fileUrl: (item && item.fileUrl) || '',
        webUrl: (item && item.webUrl) || ''
      }))
      .filter(item => item.name && (item.fileUrl || item.webUrl));
  }

  function groupByCategory(items) {
    const groups = new Map();
    items.forEach(item => {
      if (!CATEGORY_ORDER.includes(item.category)) return;
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item);
    });
    return groups;
  }

  function buildActions(item) {
    const wrap = el('div', 'download-actions');

    if (item.fileUrl) {
      const link = document.createElement('a');
      link.className = 'download-link';
      link.href = item.fileUrl;
      link.setAttribute('download', '');
      link.dataset.role = 'file-link';
      link.appendChild(downloadIcon());
      link.appendChild(translated('span', null, 'drivers.downloadPage.download'));
      wrap.appendChild(link);
      link.dataset.fileUrl = item.fileUrl;
    }

    if (item.webUrl) {
      const link = document.createElement('a');
      link.className = 'download-link download-link--ghost';
      link.href = item.webUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.appendChild(translated('span', null, 'drivers.downloadPage.webLink'));
      wrap.appendChild(link);
    }

    return wrap;
  }

  function downloadIcon() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    [['path', { d: 'M12 3v12' }], ['path', { d: 'm7 10 5 5 5-5' }], ['path', { d: 'M5 21h14' }]]
      .forEach(([tag, attrs]) => {
        const node = document.createElementNS(svgNS, tag);
        Object.keys(attrs).forEach(key => node.setAttribute(key, attrs[key]));
        svg.appendChild(node);
      });
    return svg;
  }

  function createCard(item) {
    const card = el('article', 'download-card');
    card.dataset.driverId = item.id;

    const head = el('div', 'download-card-head');
    const iconWrap = el('div', 'download-icon');
    const icon = document.createElement('img');
    icon.src = CATEGORY_ICON[item.category] || CATEGORY_ICON.keyboard;
    icon.alt = '';
    iconWrap.appendChild(icon);

    const nameWrap = el('div', 'download-name');
    nameWrap.appendChild(el('h3', null, item.name));

    head.appendChild(iconWrap);
    head.appendChild(nameWrap);

    card.appendChild(head);
    card.appendChild(buildActions(item));

    return card;
  }

  function createCategoryBlock(category, items) {
    const block = el('div', 'category-block');
    block.id = category;

    const head = el('div', 'category-head');
    head.appendChild(translated('h2', null, CATEGORY_I18N[category]));
    block.appendChild(head);

    const grid = el('div', 'download-grid');
    items.forEach(item => grid.appendChild(createCard(item)));
    block.appendChild(grid);

    return block;
  }

  function renderState(messageKey, withWebLink) {
    container.textContent = '';
    const state = el('div', 'download-state');
    state.appendChild(translated('p', null, messageKey));

    if (withWebLink) {
      const link = document.createElement('a');
      link.className = 'note-link state-link';
      link.href = '/drivers/web';
      link.dataset.i18n = 'drivers.downloadPage.webCta';
      link.textContent = t(link.dataset.i18n);
      state.appendChild(link);
    }

    container.appendChild(state);
  }

  function renderGroups(items) {
    const groups = groupByCategory(items);

    if (!groups.size) {
      renderState('drivers.downloadPage.empty', true);
      return;
    }

    container.textContent = '';
    CATEGORY_ORDER.forEach(category => {
      const groupItems = groups.get(category);
      if (groupItems && groupItems.length) {
        container.appendChild(createCategoryBlock(category, groupItems));
      }
    });
    // 分类由异步数据生成，生成后再定位识别页传来的锚点。
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && target.classList.contains('category-block')) target.scrollIntoView();
  }

  // 校验文件是否真的存在于当前服务器，避免出现「点了下载却是 404」
  async function verifyFile(link, card) {
    try {
      const res = await fetch(link.dataset.fileUrl, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) return;

      link.classList.add('is-unavailable');
      link.removeAttribute('download');
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      const label = link.querySelector('span');
      label.dataset.i18n = 'drivers.downloadPage.unavailable';
      label.textContent = t(label.dataset.i18n);
      const hint = translated('p', 'file-missing', 'drivers.downloadPage.missingFile');
      card.appendChild(hint);
    } catch (err) {
      // 网络异常时不阻断下载入口，交给浏览器处理
      console.warn('[XUNSHE] 无法校验驱动文件：', link.dataset.fileUrl, err);
    }
  }

  function verifyAllFiles() {
    if (!container) return;
    container.querySelectorAll('[data-role="file-link"]').forEach(link => {
      verifyFile(link, link.closest('.download-card'));
    });
  }

  async function loadDrivers() {
    if (!container) return;
    container.textContent = '';

    const loading = el('div', 'download-state');
    loading.appendChild(translated('p', null, 'drivers.downloadPage.loading'));
    container.appendChild(loading);

    try {
      const res = await API.get('/content/drivers', { limit: 100, sort: 'sortOrder' });
      const items = normalizeItems(res.data && res.data.items);
      renderGroups(items);
      verifyAllFiles();
    } catch (err) {
      console.error('[XUNSHE] 加载驱动列表失败：', err);
      renderState('common.error', false);
    }
  }

  function init() {
    container = document.getElementById('downloadContainer');
    if (!container) return;
    loadDrivers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
