/* ═══════════════════════════════════════════
   XUNSHE driver-web.js — 网页端 WebHID 设备识别
   设备数据全部来自 js/device-map.js，本文件不写死任何 VID/PID 或型号地址。

   交互：点「连接设备」→ 浏览器弹窗选择设备 → 自动跳转对应驱动页
         · 有网页端驱动 → 直接打开该型号网页驱动
         · 只有客户端（如 S1 耳机）→ 跳到客户端下载页对应分类
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  const DOWNLOAD_PAGE = '/drivers/download.html';
  const WEB_REDIRECT_DELAY = 700;
  const CLIENT_REDIRECT_DELAY = 900;

  const hasHID = typeof navigator !== 'undefined'
    && !!navigator.hid
    && typeof navigator.hid.requestDevice === 'function';
  const isSecure = window.isSecureContext === true;

  const state = {
    lookup: new Map(),
    drivers: [],
    busy: false,
    timer: null
  };

  let connectBtn = null;
  let statusEl = null;

  const t = key => (window.I18N && typeof window.I18N.t === 'function')
    ? window.I18N.t(key)
    : key;

  /* ── 基础工具 ── */

  function hex4(value) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0 || num > 0xffff) return null;
    return num.toString(16).padStart(4, '0');
  }

  function deviceKey(vendorId, productId) {
    const vid = hex4(vendorId);
    const pid = hex4(productId);
    if (vid === null || pid === null) return null;
    return `0x${vid}:0x${pid}`;
  }

  function normalizeKey(rawKey) {
    const match = String(rawKey || '').trim().match(/^0x([0-9a-f]{1,4}):0x([0-9a-f]{1,4})$/i);
    if (!match) return null;
    return `0x${match[1].toLowerCase().padStart(4, '0')}:${match[2].toLowerCase().padStart(4, '0')}`;
  }

  function normalizeEntry(value, key) {
    const raw = typeof value === 'string' ? { webUrl: value } : (value || {});
    const webUrl = typeof raw.webUrl === 'string' ? raw.webUrl.trim() : '';
    const legacyUrl = typeof raw.url === 'string' ? raw.url.trim() : '';
    return {
      key,
      nameKey: raw.nameKey || '',
      name: raw.name || '',
      category: raw.category || '',
      keywords: Array.isArray(raw.keywords) ? raw.keywords.map(item => String(item).toLowerCase()) : [],
      variants: Array.isArray(raw.variants) ? raw.variants : [],
      webSupported: raw.webSupported !== false,
      webUrl: webUrl || legacyUrl,
      downloadAnchor: raw.downloadAnchor || ''
    };
  }

  function buildLookup(map) {
    const lookup = new Map();
    if (!map || typeof map !== 'object') return lookup;

    Object.keys(map).forEach(rawKey => {
      const key = normalizeKey(rawKey);
      if (!key) {
        console.warn(`[XUNSHE] DEVICE_MAP 键格式不正确，已忽略：${rawKey}`);
        return;
      }
      if (lookup.has(key)) {
        console.warn(`[XUNSHE] DEVICE_MAP 存在重复键，已忽略：${rawKey}`);
        return;
      }
      lookup.set(key, normalizeEntry(map[rawKey], key));
    });

    return lookup;
  }

  function entryName(entry, productName) {
    const text = String(productName || '').trim().toLowerCase();
    if (text && entry.variants.length) {
      const variant = entry.variants.find(item =>
        Array.isArray(item.match) && item.match.some(word => text.includes(String(word).toLowerCase()))
      );
      if (variant && variant.nameKey) return t(variant.nameKey);
    }
    if (entry.nameKey) return t(entry.nameKey);
    return entry.name || entry.key;
  }

  /* ── 设备匹配 ── */

  // 精确 VID:PID → 反向上报 → 仅 PID（有线/无线切换时 VID 会变）
  function lookupEntry(device) {
    const key = deviceKey(device && device.vendorId, device && device.productId);
    if (!key) return null;
    if (state.lookup.has(key)) return state.lookup.get(key);

    const swapped = deviceKey(device.productId, device.vendorId);
    if (swapped && state.lookup.has(swapped)) return state.lookup.get(swapped);

    const pid = hex4(device && device.productId);
    if (pid) {
      let byPid = null;
      state.lookup.forEach(entry => {
        if (!byPid && entry.key.slice(-4) === pid) byPid = entry;
      });
      if (byPid) return byPid;
    }

    return null;
  }

  function matchDriverRecord(entry) {
    const pool = state.drivers.filter(driver =>
      driver && driver.webUrl && (!entry.category || driver.category === entry.category)
    );
    if (!pool.length) return null;

    if (entry.keywords.length) {
      const hit = pool.find(driver => {
        const haystack = `${driver.name || ''} ${driver.description || ''}`.toLowerCase();
        return entry.keywords.some(word => haystack.includes(word));
      });
      if (hit) return hit;
    }

    return pool.length === 1 ? pool[0] : null;
  }

  // 网页端地址：映射表写死优先，其次取后台驱动记录里的「网页端链接」
  function resolveWebUrl(entry) {
    if (!entry || !entry.webSupported) return '';
    if (entry.webUrl) return entry.webUrl;
    const record = matchDriverRecord(entry);
    return record ? record.webUrl : '';
  }

  function clientUrl(entry) {
    return `${DOWNLOAD_PAGE}${entry && entry.downloadAnchor ? '#' + entry.downloadAnchor : ''}`;
  }

  // 返回 { kind: 'web' | 'client' | 'unknown', name, url, key }
  function resolveDevice(device) {
    const key = deviceKey(device && device.vendorId, device && device.productId) || '';
    const entry = lookupEntry(device);

    if (!entry) return { kind: 'unknown', key, name: '', url: '' };

    const name = entryName(entry, device.productName);
    const webUrl = resolveWebUrl(entry);
    if (webUrl) return { kind: 'web', key, name, url: webUrl };
    return { kind: 'client', key, name, url: clientUrl(entry) };
  }

  /* ── 浏览器选择器 ── */

  // 依次尝试：仅 PID → VID+PID → 不过滤（前一步抛错才降级）
  function filterStrategies() {
    const pidFilters = [];
    const seenPid = new Set();
    const vidPidFilters = [];

    state.lookup.forEach(entry => {
      const pid = Number('0x' + entry.key.slice(-4));
      const vid = Number('0x' + entry.key.slice(2, 6));
      if (Number.isInteger(pid) && !seenPid.has(pid)) {
        seenPid.add(pid);
        pidFilters.push({ productId: pid });
      }
      if (Number.isInteger(pid) && Number.isInteger(vid)) {
        vidPidFilters.push({ vendorId: vid, productId: pid });
      }
    });

    (Array.isArray(window.EXTRA_FILTERS) ? window.EXTRA_FILTERS : []).forEach(extra => {
      if (extra && typeof extra === 'object') pidFilters.push(extra);
    });

    return [pidFilters, vidPidFilters, []];
  }

  const isCancelError = err => !!err && (err.name === 'NotFoundError' || err.name === 'AbortError');

  async function requestDevices() {
    const strategies = filterStrategies();
    let lastError = null;

    for (let i = 0; i < strategies.length; i++) {
      try {
        return await navigator.hid.requestDevice({ filters: strategies[i] });
      } catch (err) {
        lastError = err;
        console.warn(`[XUNSHE] requestDevice 失败（第 ${i + 1} 种过滤条件）：`, err);
        // 用户取消 / 权限被拒不再重试，避免连续弹窗
        if (isCancelError(err) || (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError'))) {
          throw err;
        }
      }
    }

    throw lastError;
  }

  /* ── 界面状态 ── */

  function setBusy(busy) {
    state.busy = busy;
    if (!connectBtn) return;
    connectBtn.disabled = busy;
    const label = connectBtn.querySelector('[data-connect-label]');
    if (label) label.textContent = busy ? t('drivers.web.connecting') : t('drivers.web.connectBtn');
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.className = 'connect-status';
    statusEl.textContent = '';
  }

  function setStatus(message, tone, detail) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = `connect-status${tone ? ' is-' + tone : ''}`;
    statusEl.textContent = message;
    if (detail) {
      const line = document.createElement('span');
      line.className = 'connect-detail';
      line.textContent = detail;
      statusEl.appendChild(line);
    }
  }

  function navigate(url, delay) {
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      window.location.href = url;
    }, delay);
  }

  /* ── 主流程 ── */

  async function handleConnect() {
    if (state.busy) return;
    clearStatus();

    if (!hasHID) {
      setStatus(t('drivers.web.state.unsupported'), 'warn');
      return;
    }
    if (!isSecure) {
      setStatus(t('drivers.web.state.insecure'), 'warn');
      return;
    }

    setBusy(true);
    setStatus(t('drivers.web.state.reading'));

    let devices = null;
    try {
      devices = await requestDevices();
    } catch (err) {
      setBusy(false);

      if (isCancelError(err)) {
        setStatus(t('drivers.web.state.cancelled'));
      } else if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setStatus(t('drivers.web.state.denied'), 'warn');
      } else {
        console.error('[XUNSHE] 连接设备失败：', err);
        setStatus(
          t('drivers.web.state.error'),
          'error',
          `${(err && err.name) || 'Error'}${err && err.message ? '：' + err.message : ''}`
        );
      }
      return;
    }

    setBusy(false);

    if (!Array.isArray(devices) || devices.length === 0) {
      setStatus(t('drivers.web.state.cancelled'));
      return;
    }

    // 同一设备可能上报多个 HID 接口，逐个尝试直到命中
    const seen = new Set();
    const ids = [];
    for (const device of devices) {
      const key = deviceKey(device && device.vendorId, device && device.productId);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      ids.push(key);

      const result = resolveDevice(device);
      if (result.kind === 'unknown') continue;

      if (result.kind === 'web') {
        setStatus(`${t('drivers.web.state.openingPrefix')}${result.name}${t('drivers.web.state.openingSuffix')}`, 'ok');
        navigate(result.url, WEB_REDIRECT_DELAY);
      } else {
        setStatus(`${t('drivers.web.state.clientPrefix')}${result.name}${t('drivers.web.state.clientSuffix')}`, 'warn');
        navigate(result.url, CLIENT_REDIRECT_DELAY);
      }
      return;
    }

    console.info('[XUNSHE] 未收录的设备：', ids.join(', '));
    setStatus(t('drivers.web.state.unknown'), 'warn', ids.join(' · '));
  }

  /* ── 初始化 ── */

  async function loadDrivers() {
    if (!window.API || typeof window.API.get !== 'function') return;
    try {
      const res = await window.API.get('/content/drivers', { sort: 'sortOrder', limit: 100 });
      state.drivers = res && res.data && Array.isArray(res.data.items) ? res.data.items : [];
    } catch (err) {
      console.warn('[XUNSHE] 驱动记录加载失败，将仅使用映射表中的网页端地址：', err);
      state.drivers = [];
    }
  }

  function init() {
    connectBtn = document.getElementById('connectBtn');
    statusEl = document.getElementById('connectStatus');

    state.lookup = buildLookup(window.DEVICE_MAP);

    if (connectBtn) connectBtn.addEventListener('click', handleConnect);

    // 语言切换后重绘静态标签（连接中/按钮文案）
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(() => {
        if (state.busy && connectBtn) {
          const label = connectBtn.querySelector('[data-connect-label]');
          if (label) label.textContent = t('drivers.web.connecting');
        }
      }, 0));
    });

    loadDrivers();

    if (!hasHID) {
      if (connectBtn) connectBtn.disabled = true;
      setStatus(t('drivers.web.state.unsupported'), 'warn');
    } else if (!isSecure) {
      if (connectBtn) connectBtn.disabled = true;
      setStatus(t('drivers.web.state.insecure'), 'warn');
    }
  }

  // 供调试 / 自动化测试使用：直接按设备信息解析跳转结果
  window.DriverWeb = {
    resolve: device => resolveDevice(device),
    connect: handleConnect
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
