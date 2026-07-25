const mongoose = require('mongoose');

// ② 产品中心白底图 — 用于 products.html 产品列表展示
const productImageSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },  // 关联 Product.productId
  image:     { type: String, required: true },                // 白底图 URL（1:1）
  buyLinks:  [{                                                // 购买链接（动态添加）
    platform: { type: String, default: '' },                   // 平台（如 京东）
    label:    { type: String, default: '' },                   // 按钮文字
    url:      { type: String, default: '' }                    // 链接地址
  }],
  colors:    [{                                                // 颜色变体（动态添加）
    name:  { type: String, required: true },                   // 颜色名称
    image: { type: String, required: true }                    // 颜色图 URL
  }],
  sortOrder: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productImageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 文件字段：主图 + 颜色数组中的图片
productImageSchema.statics.fileFields = ['image'];
productImageSchema.statics.arrayFileFields = ['colors.image'];

module.exports = mongoose.model('ProductImage', productImageSchema);
