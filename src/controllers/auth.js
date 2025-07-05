const { User } = require('../models');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, role = 'customer', address } = req.body;

  try {
    // Email zaten kullanılıyor mu kontrol et
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
    }

    // Admin rolü sadece admin tarafından oluşturulabilir
    if (role === 'admin') {
      return res.status(400).json({ message: 'Admin rolü oluşturulamaz' });
    }

    // Kullanıcı oluştur
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      address
    });

    // Token oluştur
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Kayıt işlemi başarısız oldu' });
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Kullanıcıyı bul
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }

    // Kullanıcı aktif mi kontrol et
    if (!user.isActive) {
      return res.status(401).json({ message: 'Hesabınız aktif değil' });
    }

    // Token oluştur
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Giriş işlemi başarısız oldu' });
  }
};

// @desc    Admin girişi
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Admin kullanıcısını bul
    const user = await User.findOne({ 
      where: { 
        email,
        role: 'admin'
      } 
    });

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz admin kimlik bilgileri' });
    }

    // Şifreyi kontrol et
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz admin kimlik bilgileri' });
    }

    // Kullanıcı aktif mi kontrol et
    if (!user.isActive) {
      return res.status(401).json({ message: 'Admin hesabı aktif değil' });
    }

    // Token oluştur
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin giriş hatası:', error);
    res.status(500).json({ message: 'Admin giriş işlemi başarısız oldu' });
  }
};

// @desc    Token doğrulama
// @route   GET /api/auth/verify
// @access  Private
exports.verifyToken = async (req, res) => {
  try {
    // Token middleware ile doğrulandı, sadece kullanıcı bilgilerini döndür
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(500).json({ message: 'Token doğrulama başarısız oldu' });
  }
};
