const basicAuth = require('basic-auth');

// 管理员用户配置
const ADMIN_USER = process.env.ADMIN_USER || 'xunshe_admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'XunShe2026!';

// IP 白名单
const getIpWhitelist = () => {
  const list = process.env.ADMIN_IP_WHITELIST || '';
  if (!list.trim()) return null; // 空白名单 = 不限制
  return list.split(',').map(ip => ip.trim());
};

/**
 * HTTP Basic Auth + IP 白名单双重验证中间件
 */
function adminAuth(req, res, next) {
  // IP 白名单检查
  const whitelist = getIpWhitelist();
  if (whitelist) {
    const clientIp = req.ip || req.connection.remoteAddress;
    if (!whitelist.includes(clientIp)) {
      return res.status(403).json({ code: 403, message: `IP ${clientIp} 不在白名单中，访问被拒绝` });
    }
  }

  // Basic Auth 检查
  const credentials = basicAuth(req);
  if (!credentials || credentials.name !== ADMIN_USER || credentials.pass !== ADMIN_PASS) {
    res.setHeader('WWW-Authenticate', 'Basic realm="XUNSHE Admin"');
    return res.status(401).json({ code: 401, message: '需要管理员认证' });
  }

  next();
}

module.exports = { adminAuth };
