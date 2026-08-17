/* ═══════════════════════════════════════════
   XUNSHE i18n — 多语言支持 (zh-CN / en / zh-TC)
   ═══════════════════════════════════════════ */

const I18N = {
  current: localStorage.getItem('xunshe-lang') || 'zh-CN',

  // 翻译字典
  dict: {
    'zh-CN': {
      // 导航
      'nav.home': '首页',
      'nav.products': '产品中心',
      'nav.drivers': '驱动下载',
      'nav.support': '技术支持',
      // 首页
      'home.hero.title': '迅蛇 — 为胜利而生',
      'home.hero.subtitle': '专业电竞外设品牌，以极致性能点燃每一场战斗',
      'home.hero.cta': '探索产品',
      'home.tag.products': '产品中心',
      'home.tag.drivers': '驱动下载',
      'home.tag.support': '技术支持',
      'home.tag.news': '最新资讯',
      'home.story.title': '品牌故事',
      'home.story.desc': 'XUNSHE（迅蛇）诞生于对电竞的极致热爱。我们相信，每一次精准的敲击、每一个毫秒级的响应，都可能决定胜负。从机械键盘到电竞鼠标，我们以蛇的迅捷与精准为灵感，打造专为胜利而生的电竞装备。',
      'home.story.mission': '极速 · 精准 · 为胜利而生',
      'home.keyboard.title': '电竞键盘',
      'home.keyboard.viewAll': '查看全部键盘',
      'home.mouse.title': '电竞鼠标',
      'home.mouse.viewAll': '查看全部鼠标',
      'home.headphone.title': '电竞耳机',
      'home.headphone.viewAll': '查看全部耳机',
      'home.carousel.learnMore': '了解更多 →',
      // 产品
      'products.title': '产品中心',
      'products.subtitle': '探索 XUNSHE 全系列电竞装备',
      'products.filter.keyboard': '键盘',
      'products.filter.mouse': '鼠标',
      'products.filter.headphone': '耳机',
      'products.empty': '暂无产品',
      // 详情
      'detail.buy': '立即购买',
      'detail.buy.jd': '京东',
      'detail.buy.tmall': '天猫',
      'detail.buy.official': '官方商城',
      'detail.specs': '技术规格',
      'detail.features': '产品特点',
      'detail.gallery': '产品图库',
      'detail.back': '返回列表',
      // 驱动
      'drivers.title': '驱动下载',
      'drivers.subtitle': '下载最新驱动，释放设备全部潜能',
      'drivers.download': '下载',
      'drivers.version': '版本',
      'drivers.platform': '平台',
      'drivers.size': '大小',
      'drivers.empty': '暂无驱动',
      // 通用
      'common.loading': '加载中...',
      'common.error': '加载失败，请稍后重试',
      'common.noData': '暂无数据',
      'common.loadMore': '加载更多',
      // 页脚
      'footer.products': '产品',
      'footer.support': '支持',
      'footer.company': '公司',
      'footer.rights': '© 2026 XUNSHE. All rights reserved. 河南郑州讯蛇科技有限公司',
      'footer.icp': '豫ICP备2026038032号',
    },
    'en': {
      'nav.home': 'Home',
      'nav.products': 'Products',
      'nav.drivers': 'Drivers',
      'nav.support': 'Support',
      'home.hero.title': 'XUNSHE — Born to Win',
      'home.hero.subtitle': 'Professional esports gear, igniting every battle with ultimate performance',
      'home.hero.cta': 'Explore Products',
      'home.tag.products': 'Products',
      'home.tag.drivers': 'Drivers',
      'home.tag.support': 'Support',
      'home.tag.news': 'News',
      'home.story.title': 'Brand Story',
      'home.story.desc': 'XUNSHE was born from a passion for esports. We believe every precise keystroke and millisecond response can determine victory. From mechanical keyboards to gaming mice, we craft gear inspired by the speed and precision of the serpent — built for victory.',
      'home.story.mission': 'Speed · Precision · Born to Win',
      'home.keyboard.title': 'Gaming Keyboards',
      'home.keyboard.viewAll': 'View All Keyboards',
      'home.mouse.title': 'Gaming Mice',
      'home.mouse.viewAll': 'View All Mice',
      'home.headphone.title': 'Gaming Headphones',
      'home.headphone.viewAll': 'View All Headphones',
      'home.carousel.learnMore': 'Learn More →',
      'products.title': 'Products',
      'products.subtitle': 'Explore the full XUNSHE lineup',
      'products.filter.keyboard': 'Keyboards',
      'products.filter.mouse': 'Mice',
      'products.filter.headphone': 'Headphones',
      'products.empty': 'No products found',
      'detail.buy': 'Buy Now',
      'detail.buy.jd': 'JD.com',
      'detail.buy.tmall': 'Tmall',
      'detail.buy.official': 'Official Store',
      'detail.specs': 'Specifications',
      'detail.features': 'Features',
      'detail.gallery': 'Gallery',
      'detail.back': 'Back to List',
      'drivers.title': 'Driver Downloads',
      'drivers.subtitle': 'Download the latest drivers to unlock full device potential',
      'drivers.download': 'Download',
      'drivers.version': 'Version',
      'drivers.platform': 'Platform',
      'drivers.size': 'Size',
      'drivers.empty': 'No drivers available',
      'common.loading': 'Loading...',
      'common.error': 'Failed to load, please try again',
      'common.noData': 'No data available',
      'common.loadMore': 'Load More',
      'footer.products': 'Products',
      'footer.support': 'Support',
      'footer.company': 'Company',
      'footer.rights': '© 2026 XUNSHE. All rights reserved. 河南郑州讯蛇科技有限公司',
      'footer.icp': '豫ICP备2026038032号',
    },
    'zh-TC': {
      'nav.home': '首頁',
      'nav.products': '產品中心',
      'nav.drivers': '驅動下載',
      'nav.support': '技術支援',
      'home.hero.title': '迅蛇 — 為勝利而生',
      'home.hero.subtitle': '專業電競外設品牌，以極致效能點燃每一場戰鬥',
      'home.hero.cta': '探索產品',
      'home.tag.products': '產品中心',
      'home.tag.drivers': '驅動下載',
      'home.tag.support': '技術支援',
      'home.tag.news': '最新資訊',
      'home.story.title': '品牌故事',
      'home.story.desc': 'XUNSHE（迅蛇）誕生於對電競的極致熱愛。我們相信，每一次精準的敲擊、每一個毫秒級的反應，都可能決定勝負。從機械鍵盤到電競滑鼠，我們以蛇的迅捷與精準為靈感，打造專為勝利而生的電競裝備。',
      'home.story.mission': '極速 · 精準 · 為勝利而生',
      'home.keyboard.title': '電競鍵盤',
      'home.keyboard.viewAll': '查看全部鍵盤',
      'home.mouse.title': '電競滑鼠',
      'home.mouse.viewAll': '查看全部滑鼠',
      'home.headphone.title': '電競耳機',
      'home.headphone.viewAll': '查看全部耳機',
      'home.carousel.learnMore': '了解更多 →',
      'products.title': '產品中心',
      'products.subtitle': '探索 XUNSHE 全系列電競裝備',
      'products.filter.keyboard': '鍵盤',
      'products.filter.mouse': '滑鼠',
      'products.filter.headphone': '耳機',
      'products.empty': '暫無產品',
      'detail.buy': '立即購買',
      'detail.buy.jd': '京東',
      'detail.buy.tmall': '天貓',
      'detail.buy.official': '官方商城',
      'detail.specs': '技術規格',
      'detail.features': '產品特點',
      'detail.gallery': '產品圖庫',
      'detail.back': '返回列表',
      'drivers.title': '驅動下載',
      'drivers.subtitle': '下載最新驅動，釋放裝置全部潛能',
      'drivers.download': '下載',
      'drivers.version': '版本',
      'drivers.platform': '平台',
      'drivers.size': '大小',
      'drivers.empty': '暫無驅動',
      'common.loading': '載入中...',
      'common.error': '載入失敗，請稍後重試',
      'common.noData': '暫無數據',
      'common.loadMore': '載入更多',
      'footer.products': '產品',
      'footer.support': '支援',
      'footer.company': '公司',
      'footer.rights': '© 2026 XUNSHE. All rights reserved. 河南郑州讯蛇科技有限公司',
      'footer.icp': '豫ICP備2026038032號',
    }
  },

  // 获取翻译
  t(key) {
    return this.dict[this.current]?.[key] || this.dict['zh-CN']?.[key] || key;
  },

  // 切换语言
  setLang(lang) {
    if (this.dict[lang]) {
      this.current = lang;
      localStorage.setItem('xunshe-lang', lang);
      this.updatePage();
    }
  },

  // 更新页面所有 i18n 元素
  updatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });

    // 更新语言切换按钮状态
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === this.current);
    });
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  I18N.updatePage();
  setupLangSwitcher();
});

function setupLangSwitcher() {
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang) I18N.setLang(lang);
    });
  });
}

// 暴露到全局
window.I18N = I18N;
