const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama middleware'i
const protect = async (req, res, next) => {
  let token;

  // Token'ı header'dan al
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Token yoksa hata döndür
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bu işlem için giriş yapmanız gerekiyor'
    });
  }

  try {
    // Token'ı verify et
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı bul
    const user = await User.findByPk(decoded.id);

    // Kullanıcı yoksa hata döndür
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token, kullanıcı bulunamadı'
      });
    }

    // Kullanıcı aktif değilse hata döndür
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hesabınız aktif değil'
      });
    }

    // Kullanıcıyı request'e ekle
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
};

// Rol kontrolü middleware'i
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `${req.user.role} rolü bu işlemi gerçekleştiremez`
      });
    }
    next();
  };
};

// Modülü dışa aktar
module.exports = protect;
module.exports.authorize = authorize;
