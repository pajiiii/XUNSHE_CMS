/* ═══════════════════════════════════════════
   XUNSHE device-detect.js — WebHID 设备自动识别
   通过 navigator.hid 读取 vendorId / productId，
   按 PID 识别设备型号，自动推荐对应驱动。
   ═══════════════════════════════════════════ */

// ============================================================
// 设备档案表 ×4（S1 耳机 / X75 / X68 键盘 / 游戏鼠标）
// ============================================================
// 关键点：同一设备在有线、2.4G 无线下上报的 VID 可能变化，PID 始终不变，
//         所以统一「按 PID 识别」，VID 只用于标注当前连接方式。
//
// 字段说明：
//   id             内部标识
//   name           兜底显示名称（HID 未上报型号时使用）
//   nameKey        兜底名称的 i18n key（优先于 name）
//   category       'keyboard' | 'mouse' | 'headphone'，用于关联驱动列表
//   pids           该型号的 PID
//   vids           该型号常见 VID（参考用）
//   vidHints       { VID: 'wired' | 'wireless24' | 'wireless' }，标注连接方式
//   variants       按 HID productName 细分的型号（共用同一驱动的产品）
//   driverKeywords 驱动名称 / 描述中的关键字，用于锁定具体驱动
//   noteKey        附加说明的 i18n key
//   url            可选，独立驱动页路径
//
// 新增设备：按下表格式追加一条档案即可，无需改动其它逻辑。
// ============================================================
const DEVICE_PROFILES = [
  // XunShe S1 耳机：有线 0x040b，无线连接时 VID 可能不同，PID 恒为 0xf77c
  {
    id: 's1-headset',
    nameKey: 'drivers.detect.model.s1',
    category: 'headphone',
    pids: [0xf77c],
    vids: [0x040b],
    driverKeywords: ['s1']
  },
  // X75 / X68 键盘：VID/PID 基本一致，仅型号名不同，共用同一个网页驱动
  {
    id: 'x75-keyboard',
    nameKey: 'drivers.detect.model.keyboard',
    category: 'keyboard',
    pids: [0x7500],
    vids: [0x0416],
    variants: [
      { match: ['x68'], nameKey: 'drivers.detect.model.x68' },
      { match: ['x75'], nameKey: 'drivers.detect.model.x75' }
    ],
    driverKeywords: ['x75', 'x68'],
    noteKey: 'drivers.detect.note.sharedDriver'
  },
  // 游戏鼠标：PID 恒为 0x2255；有线 VID 0xa8a4，2.4G 无线 VID 0xa8a5
  {
    id: 'gaming-mouse',
    nameKey: 'drivers.detect.model.mouse',
    category: 'mouse',
    pids: [0x2255],
    vids: [0xa8a4, 0xa8a5],
    vidHints: {
      0xa8a4: 'wired',
      0xa8a5: 'wireless24'
    }
  }
];

(function () {
  'use strict';

  const state = {
    drivers: [],
    driversLoaded: false,
    devices: [],
    busy: false,
    messageKey: '',
    messageTone: 'info',
    messageDetail: '',
    othersExpanded: false
  };

  let resultEl = null;
  let detectBtn = null;

  const hex16 = value => (value >>> 0).toString(16).padStart(4, '0');
  const deviceKeyOf = device => `0x${hex16(device.vendorId)}:0x${hex16(device.productId)}`;
  const t = key => (window.I18N ? window.I18N.t(key) : key);

  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));

  function isSupported() {
    return Boolean(navigator.hid && typeof navigator.hid.requestDevice === 'function') && window.isSecureContext;
  }

  function collectKnownPids() {
    const pids = new Set();
    DEVICE_PROFILES.forEach(profile => profile.pids.forEach(pid => pids.add(pid)));
    return Array.from(pids);
  }

  // VID + PID 精确组合，作为 PID 过滤失败时的第二轮尝试
  function collectVidPidFilters() {
    const seen = new Set();
    const filters = [];
    DEVICE_PROFILES.forEach(profile => {
      const vids = (profile.vids && profile.vids.length) ? profile.vids : [null];
      profile.pids.forEach(pid => {
        vids.forEach(vid => {
          const key = `${vid}:${pid}`;
          if (seen.has(key)) return;
          seen.add(key);
          filters.push(vid == null ? { productId: pid } : { vendorId: vid, productId: pid });
        });
      });
    });
    return filters;
  }

  function profileName(profile) {
    return profile.nameKey ? t(profile.nameKey) : profile.name;
  }

  function profileIcon(category) {
    if (category === 'mouse') return '/ICON/鼠标.svg';
    if (category === 'headphone') return '/ICON/耳机.svg';
    return '/ICON/键盘.svg';
  }

  const CONNECTION_KEYS = {
    wired: 'drivers.detect.connection.wired',
    wireless24: 'drivers.detect.connection.wireless24',
    wireless: 'drivers.detect.connection.wireless'
  };

  // 按 PID 匹配设备档案。个别环境会把 VID/PID 上报顺序颠倒，
  // 因此额外接受「VID 命中 vidHints 键 + PID 命中 pids」的反向组合。
  function findProfile(device) {
    return DEVICE_PROFILES.find(profile => {
      if (profile.pids.includes(device.productId)) return true;
      const hintVids = Object.keys(profile.vidHints || {}).map(Number);
      return hintVids.includes(device.productId) && profile.pids.includes(device.vendorId);
    }) || null;
  }

  function connectionOf(profile, device) {
    const hints = profile.vidHints || {};
    return hints[device.vendorId] || hints[device.productId] || null;
  }

  function resolveDeviceName(profile, device) {
    const productName = (device.productName || '').trim();
    if (profile.variants && productName) {
      const lower = productName.toLowerCase();
      const variant = profile.variants.find(item =>
        item.match.some(keyword => lower.includes(keyword))
      );
      if (variant) return variant.nameKey ? t(variant.nameKey) : variant.name;
    }
    return profileName(profile);
  }

  function matchProfileDrivers(profile) {
    const inCategory = state.drivers.filter(driver =>
      !profile.category || driver.category === profile.category
    );
    const keywords = (profile.driverKeywords || []).map(keyword => keyword.toLowerCase());
    if (keywords.length) {
      const hit = inCategory.filter(driver => {
        const haystack = `${driver.name || ''} ${driver.description || ''}`.toLowerCase();
        return keywords.some(keyword => haystack.includes(keyword));
      });
      if (hit.length) return hit;
    }
    return inCategory;
  }

  const webDriverOf = drivers => drivers.find(driver => driver.webUrl) || null;

  // 只认设备档案里的型号；其余一律视为「其他设备」，不参与驱动推荐，
  // 避免把别家键盘/鼠标误判成 XUNSHE 产品。
  function analyzeDevice(device) {
    const profile = findProfile(device);
    if (!profile) return { device, recognized: false };

    return {
      device,
      recognized: true,
      key: deviceKeyOf(device),
      profile,
      name: resolveDeviceName(profile, device),
      connection: connectionOf(profile, device),
      matches: matchProfileDrivers(profile)
    };
  }

  // 同一型号会枚举出多个 HID 接口（键盘常见上报 2 条），按型号去重
  function dedupeAnalyses(analyses) {
    const seen = new Set();
    return analyses.filter(analysis => {
      const key = analysis.recognized
        ? `device:${analysis.profile.id}:${analysis.name}`
        : `other:${deviceKeyOf(analysis.device)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderMessage(key, tone, detail) {
    if (!resultEl) return;
    state.messageKey = key;
    state.messageTone = tone || 'info';
    state.messageDetail = detail || '';
    resultEl.hidden = false;
    resultEl.className = `device-detect-result is-${state.messageTone}`;
    resultEl.innerHTML = `<div class="detect-headline">${escapeHtml(t(key))}</div>` +
      (state.messageDetail
        ? `<div class="detect-error-detail">${escapeHtml(state.messageDetail)}</div>`
        : '');
  }

  function renderDevices(scrollToMatch) {
    if (!resultEl) return;
    state.messageKey = '';
    state.messageDetail = '';

    const analyses = dedupeAnalyses(state.devices.map(analyzeDevice));
    const recognized = analyses.filter(analysis => analysis.recognized);
    const others = analyses.filter(analysis => !analysis.recognized);

    if (!analyses.length) {
      resultEl.hidden = true;
      resultEl.innerHTML = '';
      clearRecommendation();
      return;
    }

    const recommendedIds = new Set();
    recognized.forEach(analysis => analysis.matches.forEach(driver => recommendedIds.add(driver._id)));

    const tone = recognized.length ? 'success' : 'warn';
    const headline = recognized.length
      ? t('drivers.detect.matched')
      : t('drivers.detect.unmatchedHeadline');

    const rows = recognized.map(renderRecognizedRow).join('');
    const othersBlock = others.length ? renderOthers(others) : '';

    resultEl.hidden = false;
    resultEl.className = `device-detect-result is-${tone}`;
    resultEl.innerHTML = `
      <div class="detect-headline">${escapeHtml(headline)}</div>
      ${rows ? `<div class="detect-devices">${rows}</div>` : ''}
      ${othersBlock}
    `;

    applyRecommendation(recommendedIds);

    if (scrollToMatch && recommendedIds.size) {
      const firstCard = document.querySelector('#driversList .driver-card.recommended');
      if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // 只展示用户真正需要的信息：型号、连接方式、推荐驱动、进入驱动入口
  function renderRecognizedRow(analysis) {
    const connectionKey = analysis.connection ? CONNECTION_KEYS[analysis.connection] : null;
    const webDriver = webDriverOf(analysis.matches);
    const actionUrl = (webDriver && webDriver.webUrl) || analysis.profile.url;
    const driverNames = analysis.matches.map(driver => driver.name).filter(Boolean);

    const chip = connectionKey
      ? `<span class="detect-chip">${escapeHtml(t(connectionKey))}</span>`
      : '';

    let matchLine = '';
    if (driverNames.length) {
      matchLine = `<div class="detect-device-match">${escapeHtml(t('drivers.detect.recommendedDrivers'))}：<strong>${escapeHtml(driverNames.join(' / '))}</strong></div>`;
    } else if (state.driversLoaded) {
      matchLine = `<div class="detect-device-match">${escapeHtml(t('drivers.detect.noDriverInList'))}</div>`;
    }

    const note = analysis.profile.noteKey
      ? `<div class="detect-device-note">${escapeHtml(t(analysis.profile.noteKey))}</div>`
      : '';

    const action = actionUrl
      ? `<a class="detect-web-btn" href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener">${escapeHtml(t('drivers.detect.openWebDriver'))}</a>`
      : '';

    return `
      <div class="detect-device">
        <img class="icon-svg detect-device-icon" src="${escapeHtml(profileIcon(analysis.profile.category))}" alt="">
        <div class="detect-device-body">
          <div class="detect-device-line">
            <span class="detect-device-name">${escapeHtml(analysis.name)}</span>
            ${chip}
          </div>
          ${matchLine}
          ${note}
        </div>
        ${action}
      </div>
    `;
  }

  // 非 XUNSHE 设备：默认折叠，只露一个数量按钮，避免脏数据和乱码名称干扰用户
  function renderOthers(others) {
    const expanded = state.othersExpanded;

    if (window.console) {
      console.info('[XUNSHE] 未收录设备：', others.map(analysis =>
        `${deviceKeyOf(analysis.device)} ${analysis.device.productName || ''}`.trim()
      ));
    }

    const items = others.map((_, index) =>
      `<span class="detect-other-item">${escapeHtml(t('drivers.detect.otherItem'))} ${index + 1}</span>`
    ).join('');

    return `
      <div class="detect-others">
        <button type="button" class="detect-more" data-action="toggle-others" aria-expanded="${expanded ? 'true' : 'false'}">
          <span>${escapeHtml(t('drivers.detect.others'))} (${others.length})</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>
        <div class="detect-others-body"${expanded ? '' : ' hidden'}>
          <div class="detect-others-list">${items}</div>
          <p class="detect-others-note">${escapeHtml(t('drivers.detect.othersTip'))}</p>
        </div>
      </div>
    `;
  }

  function applyRecommendation(ids) {
    document.querySelectorAll('#driversList .driver-card').forEach(card => {
      card.classList.toggle('recommended', ids.has(card.dataset.driverId));
    });
  }

  function clearRecommendation() {
    document.querySelectorAll('#driversList .driver-card.recommended').forEach(card => card.classList.remove('recommended'));
  }

  function setBusy(busy) {
    state.busy = busy;
    if (detectBtn) detectBtn.disabled = busy;
  }

  function syncAuthorizedDevices() {
    navigator.hid.getDevices().then(devices => {
      state.devices = Array.isArray(devices) ? devices : [];
      if (state.devices.length) renderDevices(false);
      else {
        resultEl.hidden = true;
        resultEl.innerHTML = '';
        clearRecommendation();
      }
    }).catch(() => { /* 权限未授予时忽略 */ });
  }

  const ERROR_HINTS = {
    NotFoundError: 'drivers.detect.cancelled',
    AbortError: 'drivers.detect.cancelled',
    NotAllowedError: 'drivers.detect.denied',
    SecurityError: 'drivers.detect.denied',
    NotSupportedError: 'drivers.detect.notSupported',
    InvalidStateError: 'drivers.detect.busyPicker'
  };

  const errorNameOf = err => (err && err.name) || 'Error';
  const isCancelError = err => ['NotFoundError', 'AbortError'].includes(errorNameOf(err));
  const isBlockedError = err => ['NotAllowedError', 'SecurityError'].includes(errorNameOf(err));

  // 依次尝试：PID 过滤 → VID+PID 组合 → 不过滤（仅在前一步异常时才降级）
  function requestStrategies() {
    return [
      { label: 'productId', filters: collectKnownPids().map(productId => ({ productId })) },
      { label: 'vendorId+productId', filters: collectVidPidFilters() },
      { label: 'no-filter', filters: [] }
    ];
  }

  async function requestDevices() {
    let lastError = null;
    const strategies = requestStrategies();

    for (let i = 0; i < strategies.length; i++) {
      try {
        return await navigator.hid.requestDevice({ filters: strategies[i].filters });
      } catch (err) {
        lastError = err;
        if (isCancelError(err) || isBlockedError(err)) throw err;
        console.warn(`[XUNSHE] requestDevice 失败（策略 ${strategies[i].label}），尝试降级：`, err);
      }
    }
    throw lastError;
  }

  const WARN_ERRORS = ['NotFoundError', 'AbortError', 'NotAllowedError', 'SecurityError'];

  function showDetectError(err) {
    console.error('[XUNSHE] 识别设备失败：', err);
    const name = errorNameOf(err);
    const isWarn = WARN_ERRORS.includes(name);
    const detail = isWarn ? '' : `${name}${err && err.message ? '：' + err.message : ''}`;
    renderMessage(ERROR_HINTS[name] || 'drivers.detect.error', isWarn ? 'warn' : 'error', detail);
  }

  async function detect() {
    if (state.busy || !detectBtn) return;

    if (!isSupported()) {
      renderMessage('drivers.detect.unsupported', 'warn');
      return;
    }

    setBusy(true);
    renderMessage('drivers.detect.reading', 'info');

    let devices = null;
    try {
      // 必须在用户手势中直接调用 requestDevice
      devices = await requestDevices();
    } catch (err) {
      setBusy(false);
      state.devices = [];
      clearRecommendation();
      showDetectError(err);
      return;
    }

    setBusy(false);

    if (!devices || devices.length === 0) {
      state.devices = [];
      clearRecommendation();
      renderMessage('drivers.detect.cancelled', 'warn');
      return;
    }

    state.devices = Array.from(devices);
    state.othersExpanded = false;

    if (window.console) {
      console.info('[XUNSHE] 已选设备：', state.devices.map(device =>
        `${deviceKeyOf(device)} ${device.productName || ''}`.trim()
      ));
    }

    // 渲染异常单独兜底，避免和「读取设备信息失败」混淆
    try {
      renderDevices(true);
    } catch (renderErr) {
      console.error('[XUNSHE] 识别结果渲染失败：', renderErr);
      renderMessage('drivers.detect.renderError', 'error', `${errorNameOf(renderErr)}：${renderErr && renderErr.message}`);
    }
  }

  function watchLanguage() {
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.addEventListener('click', () => {
        // 等 i18n.setLang() 更新完当前语言后再重绘动态内容
        setTimeout(() => {
          renderModels();
          if (state.devices.length) renderDevices(false);
          else if (state.messageKey) renderMessage(state.messageKey, state.messageTone, state.messageDetail);
        }, 0);
      });
    });
  }

  // 已支持型号标签，由设备档案表生成，新增档案后自动出现在页面上
  function renderModels() {
    const list = document.getElementById('detectModelList');
    if (!list) return;
    list.innerHTML = DEVICE_PROFILES
      .map(profile => `<span class="detect-model">${escapeHtml(profileName(profile))}</span>`)
      .join('');
  }

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    resultEl = document.getElementById('deviceDetectResult');
    detectBtn = document.getElementById('detectDeviceBtn');
    if (!resultEl || !detectBtn) return;

    renderModels();
    watchLanguage();

    if (!isSupported()) {
      detectBtn.disabled = true;
      renderMessage('drivers.detect.unsupported', 'warn');
      return;
    }

    detectBtn.addEventListener('click', () => detect());

    resultEl.addEventListener('click', event => {
      const toggle = event.target.closest('[data-action="toggle-others"]');
      if (!toggle) return;
      state.othersExpanded = !state.othersExpanded;
      renderDevices(false);
    });

    if (!navigator.hid.onconnect) {
      navigator.hid.onconnect = () => syncAuthorizedDevices();
      navigator.hid.ondisconnect = () => syncAuthorizedDevices();
    }

    syncAuthorizedDevices();
  }

  // 页面加载完驱动列表后回填，用于匹配与重绘
  function setDrivers(items) {
    state.drivers = Array.isArray(items) ? items : [];
    state.driversLoaded = true;
    if (state.devices.length) renderDevices(false);
  }

  window.DeviceDetect = { setDrivers, detect };

  document.addEventListener('DOMContentLoaded', init);
})();
