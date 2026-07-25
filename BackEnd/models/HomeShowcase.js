const mongoose = require('mongoose');

// ④ 主页展示图 — 用于 index.html 电竞键盘/电竞鼠标下方的展示栏
const homeShowcaseSchema = new mongoose.Schema({
  productId:   { type: String, required: true, index: true },  // 关联 Product.productId
  image:       { type: String, required: true },                // 展示图（4:3）
  description: { type: String, default: '' },                   // 产品描述文字
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

homeShowcaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

homeShowcaseSchema.statics.fileFields = ['image'];

module.exports = mongoose.model('HomeShowcase', homeShowcaseSchema);
