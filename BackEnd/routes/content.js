const express = require('express');
const router = express.Router();
const fs   = require('fs');
const path = require('path');
const { adminAuth } = require('../middleware/auth');

// ── 模型映射表（新的 5 种数据类型） ──
const models = {
  'products':        require('../models/Product'),       // ① 产品目录
  'product-images':  require('../models/ProductImage'),  // ② 产品中心白底图
  'home-carousel':   require('../models/HomeCarousel'),  // ③ 主页轮播图
  'home-showcase':   require('../models/HomeShowcase'),  // ④ 主页展示图
  'drivers':         require('../models/Driver')         // ⑤ 驱动支持
};

// ── 辅助：删除已存储在本地的文件 ──
function deleteFileIfLocal(filePath) {
  if (!filePath || typeof filePath !== 'string') return;
  if (!filePath.startsWith('/uploads/')) return;
  const abs = path.join(__dirname, '..', filePath);
  try {
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      console.log(`🗑️  已删除文件: ${filePath}`);
    }
  } catch (err) {
    console.error(`⚠️  删除文件失败: ${filePath}`, err.message);
  }
}

function deleteLocalFiles(doc, Model) {
  if (!doc) return;

  // 顶层文件字段
  const fields = Model.fileFields || [];
  fields.forEach(field => deleteFileIfLocal(doc[field]));

  // 数组中的文件字段（如 colors.image）
  const arrFields = Model.arrayFileFields || [];
  arrFields.forEach(compound => {
    const [arrName, subField] = compound.split('.');
    const arr = doc[arrName];
    if (Array.isArray(arr)) {
      arr.forEach(item => deleteFileIfLocal(item[subField]));
    }
  });
}

// ── GET /api/content/:type — 获取内容（公开接口） ──
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const Model = models[type];
    if (!Model) {
      return res.status(400).json({ code: 400, message: `无效的内容类型: ${type}` });
    }

    const { category, productId, page = 1, limit = 50, sort = '-createdAt' } = req.query;

    const filter = {};
    if (Model.schema.paths.isActive) filter.isActive = true;
    if (category) filter.category = category;
    if (productId) filter.productId = productId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Model.countDocuments(filter);
    const items = await Model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      code: 200,
      data: { items, total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(`GET /api/content/${req.params.type} 错误:`, err.message);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ── GET /api/content/:type/all — 获取全部（管理后台用，需认证） ──
router.get('/:type/all', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const Model = models[type];
    if (!Model) {
      return res.status(400).json({ code: 400, message: `无效的内容类型: ${type}` });
    }

    const items = await Model.find({}).sort('-createdAt').lean();
    res.json({ code: 200, data: { items, total: items.length } });
  } catch (err) {
    console.error(`GET /api/content/${req.params.type}/all 错误:`, err.message);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// ── POST /api/content/:type — 新增（需认证） ──
router.post('/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const Model = models[type];
    if (!Model) {
      return res.status(400).json({ code: 400, message: `无效的内容类型: ${type}` });
    }

    const doc = new Model(req.body);
    const saved = await doc.save();
    res.status(201).json({ code: 201, message: '创建成功', data: saved });
  } catch (err) {
    console.error(`POST /api/content/${req.params.type} 错误:`, err.message);
    if (err.code === 11000) {
      return res.status(409).json({ code: 409, message: '数据已存在（唯一键冲突）' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join('; ');
      return res.status(400).json({ code: 400, message: messages });
    }
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ── PUT /api/content/:type/:id — 更新（需认证） ──
router.put('/:type/:id', adminAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = models[type];
    if (!Model) {
      return res.status(400).json({ code: 400, message: `无效的内容类型: ${type}` });
    }

    // 更新前先查旧记录（用于后续旧文件清理）
    const oldDoc = await Model.findById(id);

    const updated = await Model.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ code: 404, message: '数据未找到' });
    }

    // 如果图片/文件字段被更新为新值，删除旧文件
    if (oldDoc) {
      const fileFields = Model.fileFields || [];
      fileFields.forEach(field => {
        const oldVal = oldDoc[field];
        const newVal = updated[field];
        if (oldVal && oldVal !== newVal && typeof oldVal === 'string' && oldVal.startsWith('/uploads/')) {
          const absPath = path.join(__dirname, '..', oldVal);
          try {
            if (fs.existsSync(absPath)) {
              fs.unlinkSync(absPath);
              console.log(`🗑️  更新时删除旧文件: ${oldVal}`);
            }
          } catch (e) {
            console.error(`⚠️  删除旧文件失败: ${oldVal}`, e.message);
          }
        }
      });
    }

    res.json({ code: 200, message: '更新成功', data: updated });
  } catch (err) {
    console.error(`PUT /api/content/${req.params.type}/${req.params.id} 错误:`, err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join('; ');
      return res.status(400).json({ code: 400, message: messages });
    }
    res.status(500).json({ code: 500, message: err.message });
  }
});

// ── DELETE /api/content/:type/:id — 删除（需认证，同时删除关联文件） ──
router.delete('/:type/:id', adminAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = models[type];
    if (!Model) {
      return res.status(400).json({ code: 400, message: `无效的内容类型: ${type}` });
    }

    const deleted = await Model.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ code: 404, message: '数据未找到' });
    }

    // 删除关联的本地文件
    deleteLocalFiles(deleted, Model);

    res.json({ code: 200, message: '删除成功', data: deleted });
  } catch (err) {
    console.error(`DELETE /api/content/${req.params.type}/${req.params.id} 错误:`, err.message);
    res.status(500).json({ code: 500, message: err.message });
  }
});

module.exports = router;
