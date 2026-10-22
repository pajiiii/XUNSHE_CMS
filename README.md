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
│   │   └── Driver.js          # ⑤ 驱动下载
│   ├── middleware/
│   │   └── auth.js            # 认证中间件
│   └── uploads/               # 上传文件目录
└── FrontEnd/
    ├── index.html             # 首页
    ├── products.html          # 产品列表页
    ├── detail.html            # 产品详情页
    ├── drivers.html           # 驱动下载页
    ├── admin.html             # 管理后台
    ├── css/
    │   └── common.css         # 深色电竞主题 + 全局质感层（氛围背景/按钮/卡片/页头/页脚）
    └── js/
        ├── common.js          # 公共交互逻辑
        ├── device-detect.js   # WebHID 设备自动识别
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

## 驱动页设备识别

`drivers.html` 的「识别设备」按钮通过 WebHID（`navigator.hid.requestDevice`）读取设备的
`vendorId` / `productId`，匹配 `FrontEnd/js/device-detect.js` 中的 `DEVICE_PROFILES` 后高亮推荐驱动。

匹配以 **PID 为准**：同一设备在有线 / 2.4G 无线下 VID 可能变化，PID 保持不变。

| 型号 | VID | PID | 说明 |
|------|-----|-----|------|
| 迅蛇 S1 耳机 | 0x040b（无线可能不同） | 0xf77c | — |
| 迅蛇 X75 键盘 | 0x0416 | 0x7500 | 与 X68 共用同一网页驱动 |
| 迅蛇 X68 键盘 | 0x0416 | 0x7500 | 仅型号名不同，驱动同 X75 |
| 迅蛇 电竞鼠标 | 0xa8a4（有线）/ 0xa8a5（2.4G 无线） | 0x2255 | 页面会标注当前连接方式 |

- 仅在桌面版 Chrome / Edge 且通过 HTTPS 或 localhost 访问时可用
- 新增型号：在 `DEVICE_PROFILES` 中追加一条档案（`pids` 必填，可选 `vids` / `vidHints` / `variants` / `driverKeywords`）
- 同一型号枚举出的多个 HID 接口会自动合并为一行
- 未收录的设备会折叠到「其他设备」，页面只保留数量，具体 VID / PID 打印在浏览器控制台，便于客服排查
- 识别失败会自动降级重试：PID 过滤 → VID + PID → 不过滤设备；仍失败时页面会显示错误类型（如 `TypeError`），完整信息打印在浏览器控制台
- 推荐驱动卡片使用渐变流光 + 呼吸高亮提示，并遵循系统 `prefers-reduced-motion` 设置
- 若设备未出现在浏览器选择器中（系统级键鼠接口可能被浏览器屏蔽），可在 Windows「设备管理器 → 硬件 ID」查看 VID/PID 后补录

## 环境变量

参见 `BackEnd/.env` 文件。
