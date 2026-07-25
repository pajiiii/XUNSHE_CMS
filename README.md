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
│   │   ├── Product.js         # 产品主表
│   │   ├── HomeCarousel.js    # 首页轮播
│   │   ├── HomeTag.js         # 首页快捷入口
│   │   ├── ProductTag.js      # 产品标签
│   │   ├── ProductDetail.js   # 产品详情
│   │   └── Driver.js          # 驱动下载
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
    │   └── common.css         # 深色电竞主题
    └── js/
        ├── common.js          # 公共交互逻辑
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
| POST | /api/content/:type | 新增内容 | 是 |
| PUT | /api/content/:type/:id | 更新内容 | 是 |
| DELETE | /api/content/:type/:id | 删除内容 | 是 |
| POST | /api/upload | 上传图片 | 是 |
| POST | /api/upload-driver | 上传驱动 | 是 |

内容类型 `:type`: `products`, `home-carousel`, `home-tag`, `product-tag`, `product-detail`, `driver`

## 管理后台

访问 `/admin.html`，使用 `.env` 中配置的管理员账号登录。

## 环境变量

参见 `BackEnd/.env` 文件。
