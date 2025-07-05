const { User, Order } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// @desc    Kullanıcı profilini getir
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: 'Profil getirilirken hata oluştu' });
  }
};

// @desc    Kullanıcı bilgilerini güncelle
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Güncellenecek alanlar
    const { name, phone, address } = req.body;
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // Kullanıcıyı kaydet
    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ message: 'Profil güncellenirken hata oluştu' });
  }
};

// @desc    Şifre değiştir
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Mevcut şifreyi kontrol et
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }

    // Yeni şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Kullanıcıyı kaydet
    await user.save();

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Şifre değiştirilirken hata oluştu' });
  }
};

// @desc    Kullanıcı siparişlerini getir
// @route   GET /api/users/orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId: req.user.id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: ['orderItems', 'store']
    });

    res.json({
      success: true,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      orders
    });
  } catch (error) {
    console.error('Sipariş getirme hatası:', error);
    res.status(500).json({ message: 'Siparişler getirilirken hata oluştu' });
  }
};
