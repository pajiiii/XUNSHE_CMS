require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// ── 信任代理（Nginx 反向代理场景）──
// 设置为 1 表示信任第一个代理（Nginx）
app.set('trust proxy', 1);

// ── CORS 配置 ──
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5500']; // 开发默认值

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（同源请求、Postman 等工具）
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  maxAge: 86400 // 预检请求缓存 24 小时
}));

// ── 中间件 ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── 全局限速：15 分钟内每个 IP 最多 600 次请求 ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
app.use('/api', globalLimiter);

// ── 管理员 API 专用限速：15 分钟内每个 IP 最多 30 次（防暴力破解）──
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '管理员请求过于频繁，请 15 分钟后再试' }
});
app.use('/api/content', adminLimiter);
app.use('/api/upload', adminLimiter);

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

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // 初始连接超时 5 秒
  heartbeatFrequencyMS: 10000     // 每 10 秒发送心跳
})
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

// ── MongoDB 连接事件监听（断连自动重连） ──
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB 连接断开，Mongoose 将自动尝试重连...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB 已重新连接');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB 连接错误:', err.message);
});

module.exports = app;
