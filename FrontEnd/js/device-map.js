/* ═══════════════════════════════════════════
   XUNSHE device-map.js — 设备 VID / PID 映射表（纯数据文件）
   业务逻辑见 js/driver-web.js，请勿在本文件写任何 DOM / 跳转代码。
   ═══════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────────────
   DEVICE_MAP：自动识别用的设备档案
   ────────────────────────────────────────────────────────────────
   键固定为 '0xVID:0xPID'（十六进制、小写、4 位补零）。

   字段：
     nameKey         型号显示名（i18n key）
     variants        按设备上报的名称细分型号（共用同一 VID/PID）
     category        keyboard | mouse | headphone，用于关联后台驱动记录
     keywords        在后台驱动记录的「名称 / 描述」中匹配的关键字
     webSupported    该型号是否提供网页端驱动
                      · true  → 优先跳网页端；取不到链接时自动降级为「下载客户端」
                      · false → 直接提示「暂无网页端，请下载客户端」
     webUrl          可选，直接写死网页端地址（留空则读取后台驱动记录里的「网页端链接」）
     downloadAnchor  客户端下载页的定位锚点（/drivers/download.html#xxx）

   新增型号：复制一条档案改成真实 VID / PID 即可，无需改业务代码。
   ──────────────────────────────────────────────────────────────── */
const DEVICE_MAP = {
  // 迅蛇 X75 / X68 键盘：VID/PID 相同，仅名称不同，共用同一个网页端驱动
  '0x0416:0x7500': {
    nameKey: 'drivers.detect.model.keyboard',
    variants: [
      { match: ['x68'], nameKey: 'drivers.detect.model.x68' },
      { match: ['x75'], nameKey: 'drivers.detect.model.x75' }
    ],
    category: 'keyboard',
    keywords: ['x75', 'x68'],
    webSupported: true,
    downloadAnchor: 'keyboard'
  },

  // 迅蛇 S1 耳机：有线 0x040b；无线连接时 VID 可能不同，PID 恒为 0xf77c。
  // 该型号目前没有网页端驱动，识别后引导用户下载客户端。
  '0x040b:0xf77c': {
    nameKey: 'drivers.detect.model.s1',
    category: 'headphone',
    keywords: ['s1'],
    webSupported: false,
    downloadAnchor: 'headphone'
  },

  // 迅蛇电竞鼠标：PID 恒为 0x2255，有线 0xa8a4 / 2.4G 无线 0xa8a5
  '0xa8a4:0x2255': {
    nameKey: 'drivers.detect.model.mouseWired',
    category: 'mouse',
    keywords: ['m2', 'mouse', '鼠标', '滑鼠'],
    webSupported: true,
    downloadAnchor: 'mouse'
  },
  '0xa8a5:0x2255': {
    nameKey: 'drivers.detect.model.mouseWireless',
    category: 'mouse',
    keywords: ['m2', 'mouse', '鼠标', '滑鼠'],
    webSupported: true,
    downloadAnchor: 'mouse'
  }
};

/* ────────────────────────────────────────────────────────────────
   MODEL_GROUPS 已移除：页面「支持范围」改为按钮下方的一行说明，
   具体型号能力直接由 DEVICE_MAP 的 webSupported 决定。
   ──────────────────────────────────────────────────────────────── */

// 设备选择器的过滤条件：默认由 DEVICE_MAP 的 PID 自动生成。
// 若要额外按厂商收窄，可在此追加 { vendorId: 0x0416 }。
const EXTRA_FILTERS = [];

// 以原生脚本方式暴露给 driver-web.js（无打包工具）
window.DEVICE_MAP = DEVICE_MAP;
window.EXTRA_FILTERS = EXTRA_FILTERS;
