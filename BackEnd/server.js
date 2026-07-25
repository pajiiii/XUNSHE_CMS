require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// ── 中间件 ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 信任代理（Nginx 反向代理场景）
app.set('trust proxy', 1);

// 静态文件服务 — 前端页面
app.use(express.static(path.join(__dirname, '..', 'FrontEnd')));

// Logo 静态服务
app.use('/logo', express.static(path.join(__dirname, '..', 'logo')));

// 图标静态服务
app.use('/ICON', express.static(path.join(__dirname, '..', 'ICON')));

// 上传文件静态服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── 路由 ──
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);

// ── 健康检查 ──
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'XUNSHE API is running', timestamp: new Date().toISOString() });
});

// ── SPA fallback: 所有非 API / 非文件请求返回首页 ──
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ code: 404, message: 'Not Found' });
  }
  res.sendFile(path.join(__dirname, '..', 'FrontEnd', 'index.html'));
});

// ── 全局错误处理 ──
app.use((err, req, res, next) => {
  console.error('未捕获错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// ── 连接数据库并启动 ──
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xunshe';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas 连接成功');
    app.listen(PORT, () => {
      console.log(`🚀 XUNSHE 服务器启动: http://localhost:${PORT}`);
      console.log(`📡 API 地址: http://localhost:${PORT}/api`);
      console.log(`🖥️  管理后台: http://localhost:${PORT}/admin.html`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message);
    process.exit(1);
  });

module.exports = app;
