const mongoose = require('mongoose');

// ① 产品目录 — 记录所有产品的 ID、名称、类型，作为其他数据的映射基础
const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },  // 型号，如 M2
  name:      { type: String, required: true },                               // 产品名称，如 迅蛇 M2
  category:  { type: String, required: true, enum: ['keyboard', 'mouse', 'headphone'], index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
