const mongoose = require('mongoose');

// ③ 主页轮播图 — 用于 index.html 轮播图区域
const homeCarouselSchema = new mongoose.Schema({
  productId:   { type: String, required: true, index: true },  // 关联 Product.productId
  image:       { type: String, required: true },                // 轮播展示图（2:1）
  description: { type: String, default: '' },                   // 产品描述文字
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

homeCarouselSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

homeCarouselSchema.statics.fileFields = ['image'];

module.exports = mongoose.model('HomeCarousel', homeCarouselSchema);
