const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { adminAuth } = require('../middleware/auth');

const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE) || 209715200; // 200MB

/**
 * 生成唯一文件名 — 使用 crypto.randomUUID() 彻底避免碰撞
 * 格式: {timestamp}-{uuid8}{ext}
 */
function uniqueFilename(originalname) {
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  const ext = path.extname(originalname);
  return `${Date.now()}-${uuid}${ext}`;
}

// 图片上传配置
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'images'));
  },
  filename: (req, file, cb) => {
    cb(null, uniqueFilename(file.originalname));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片格式: jpg, jpeg, png, gif, webp, svg, bmp'));
    }
  }
});

// 驱动文件上传配置
const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'drivers'));
  },
  filename: (req, file, cb) => {
    cb(null, uniqueFilename(file.originalname));
  }
});

const driverUpload = multer({
  storage: driverStorage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(zip|rar|7z|exe|msi|dmg|pkg|tar\.gz|deb|rpm)$/i;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) || file.originalname.toLowerCase().endsWith('.tar.gz')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持驱动文件格式: zip, rar, 7z, exe, msi, dmg, pkg, tar.gz, deb, rpm'));
    }
  }
});

// POST /api/upload — 上传图片（需认证）
router.post('/', adminAuth, (req, res) => {
  imageUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ code: 413, message: '文件大小超过限制' });
        }
        return res.status(400).json({ code: 400, message: err.message });
      }
      return res.status(400).json({ code: 400, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '未选择文件' });
    }
    const fileUrl = `/uploads/images/${req.file.filename}`;
    res.json({ code: 200, message: '上传成功', data: { url: fileUrl, filename: req.file.filename, size: req.file.size } });
  });
});

// POST /api/upload/driver — 上传驱动文件（需认证）
router.post('/driver', adminAuth, (req, res) => {
  driverUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ code: 413, message: '文件大小超过限制' });
        }
        return res.status(400).json({ code: 400, message: err.message });
      }
      return res.status(400).json({ code: 400, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '未选择文件' });
    }
    const fileUrl = `/uploads/drivers/${req.file.filename}`;
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        sizeFormatted: formatFileSize(req.file.size)
      }
    });
  });
});

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
