# XUNSHE (迅蛇) 官网项目

专业电竞外设品牌官网，基于 Node.js + Express + MongoDB Atlas 全栈架构。

## 技术栈

- **前端**: 原生 HTML/CSS/JS（无框架）
- **后端**: Node.js + Express
- **数据库**: MongoDB Atlas
- **部署**: 阿里云 + Nginx 反向代理 + PM2 进程守护

## 项目结构

```
XUNSHE/
├── BackEnd/
│   ├── server.js              # Express 主入口
│   ├── package.json
│   ├── .env                   # 环境变量
│   ├── routes/
│   │   ├── content.js         # 内容 CRUD API
│   │   └── upload.js          # 文件上传 API
│   ├── models/
│   │   ├── Product.js         # ① 产品主表
│   │   ├── ProductImage.js    # ② 产品中心白底图
│   │   ├── HomeCarousel.js    # ③ 首页轮播图
│   │   ├── HomeShowcase.js    # ④ 主页展示图
│   │   └── Driver.js          # ⑤ 驱动资源（安装包 / 网页端链接）
│   ├── middleware/
│   │   └── auth.js            # 认证中间件
│   └── uploads/               # 上传文件目录
└── FrontEnd/
    ├── index.html             # 首页
    ├── products.html          # 产品列表页
    ├── detail.html            # 产品详情页
    ├── drivers.html           # 驱动支持入口页（网页端 / 客户端分流）
    ├── drivers/
    │   ├── web.html           # 网页端在线驱动（WebHID 识别）
    │   └── download.html      # 客户端软件下载（静态页）
    ├── admin.html             # 管理后台
    ├── css/
    │   └── common.css         # 深色电竞主题 + 全局质感层（氛围背景/按钮/卡片/页头/页脚）
    └── js/
        ├── common.js          # 公共交互逻辑
        ├── device-map.js      # 设备 VID/PID 映射表（纯数据）
        ├── driver-web.js      # WebHID 识别与跳转逻辑
        └── i18n.js            # 多语言支持
```

## 快速开始

```bash
# 1. 进入后端目录
cd BackEnd

# 2. 安装依赖
npm install

# 3. 启动服务
npm start

# 4. 开发模式（需安装 nodemon）
npm run dev
```

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/content/:type | 获取公开内容 | 否 |
| GET | /api/content/:type/all | 获取全部内容 | 是 |
| GET | /api/content/:type/:id | 获取单条内容 | 是 |
| POST | /api/content/:type | 新增内容 | 是 |
| PUT | /api/content/:type/:id | 更新内容 | 是 |
| DELETE | /api/content/:type/:id | 删除内容 | 是 |
| POST | /api/upload | 上传图片 | 是 |
| POST | /api/upload/driver | 上传驱动文件 | 是 |

内容类型 `:type`: `products`, `product-images`, `home-carousel`, `home-showcase`, `drivers`

## 管理后台

访问 `/admin.html`，使用 `.env` 中配置的管理员账号登录。

## 驱动支持

驱动页拆分为两个入口，`drivers.html` 只负责分流：

| 页面 | 路由 | 说明 |
|------|------|------|
| 驱动支持入口 | `/drivers.html` | 选择网页端驱动或客户端下载 |
| 网页端驱动 | `/drivers/web` | 一个「连接设备」按钮 → 浏览器选择器 → 自动跳转 |
| 客户端软件下载 | `/drivers/download` | 静态下载页，安装包位于 `BackEnd/uploads/drivers/` |

### 网页端识别逻辑

1. 点击「连接设备」→ `navigator.hid.requestDevice({ filters })`（`filters` 由映射表的 PID 自动生成）
2. 浏览器弹出设备选择框，用户选中设备后读取 `vendorId` / `productId`，拼成 `'0xVID:0xPID'`
3. **自动跳转**：
   - 有网页端驱动 → 直接打开该型号网页驱动
   - 只有客户端（如 S1 耳机）→ 跳到 `/drivers/download.html#headphone`
4. 未命中 / 取消 / 权限拒绝时，按钮下方只显示一行状态文案；未识别时附带设备 ID 便于排查

过滤器按三级降级，任何一级抛错都自动换下一级，避免「识别失败」直接卡死：

| 顺序 | filters | 说明 |
|------|---------|------|
| 1 | `[{ productId }]` | 最精确，选择器只列迅蛇设备 |
| 2 | `[{ vendorId, productId }]` | 部分浏览器不接受只有 PID 的过滤器 |
| 3 | `[]` | 兜底，列出全部 HID 设备 |

> 真正的异常（非用户取消）会显示错误类型与 message，并打印到浏览器控制台，
> 例如 `NotAllowedError`（权限/用户手势）或 `TypeError`（过滤器不被接受）。

页面底部只有一行支持说明：迅蛇 X75 / X68 键盘、电竞鼠标支持网页端，S1 耳机请下载客户端。

### 设备数据（逻辑与数据分离）

所有设备数据集中在 `FrontEnd/js/device-map.js`，业务逻辑 `FrontEnd/js/driver-web.js` 中不包含任何
VID/PID 或型号信息：

| 型号 | VID | PID | 网页端 | 客户端 |
|------|-----|-----|--------|--------|
| 迅蛇 X75 / X68 键盘 | 0x0416 | 0x7500 | 支持 | 支持 |
| 迅蛇 电竞鼠标 | 0xa8a4（有线）/ 0xa8a5（2.4G） | 0x2255 | 支持 | 支持 |
| 迅蛇 S1 耳机 | 0x040b（无线可能不同） | 0xf77c | 不支持 | 支持 |

- `DEVICE_MAP`：`'0xVID:0xPID' → { nameKey, category, keywords, webSupported, webUrl, downloadAnchor }`
- `EXTRA_FILTERS`：追加到 `requestDevice` 的额外过滤条件（默认按 PID 过滤）
- 网页端地址优先级：`DEVICE_MAP.webUrl`（写死） → 后台驱动记录的 `webUrl`（按 `category` + `keywords` 匹配）
- `webSupported: false` 的型号永不跳网页端，统一引导下载客户端
- 匹配顺序：精确 `VID:PID` → 反向上报 → 仅 PID（有线/无线切换时 VID 会变）

兼容性：仅桌面版 Chrome / Edge，且必须通过 HTTPS 或 localhost 访问（WebHID 安全上下文要求）。
Safari / Firefox 会禁用按钮并提示更换浏览器。

客户端安装包：上传到 `BackEnd/uploads/drivers/` 后，把 `FrontEnd/drivers/download.html` 中对应
`href` 替换成上传接口返回的真实地址。

## 环境变量

参见 `BackEnd/.env` 文件。
