const mongoose = require('mongoose');

// ⑤ 驱动支持 — 用于 drivers.html 驱动下载页面
const driverSchema = new mongoose.Schema({
  category:    { type: String, required: true, enum: ['keyboard', 'mouse', 'headphone'], index: true },
  name:        { type: String, required: true },                             // 驱动名称
  description: { type: String, default: '' },                                // 驱动描述（适配型号等）
  fileUrl:     { type: String, default: '' },                                // 客户端文件路径（选填，限制 200M）
  webUrl:      { type: String, default: '' },                                // 网页端驱动链接（选填）
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

// 自定义验证：fileUrl 和 webUrl 至少有一个
driverSchema.pre('validate', function(next) {
  if (!this.fileUrl && !this.webUrl) {
    const err = new mongoose.Error.ValidationError(this);
    err.addError('fileUrl', new mongoose.Error.ValidatorError({ message: '客户端文件和网页端链接至少需要提供一个' }));
    return next(err);
  }
  next();
});

driverSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

driverSchema.statics.fileFields = ['fileUrl'];

module.exports = mongoose.model('Driver', driverSchema);
