const { Store, User, Product, Category } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Tüm mağazaları listele (müşteriler için)
// @route   GET /api/stores
// @access  Public
exports.getAllStores = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      isOpen: true
    };

    if (search) {
      whereClause.name = {
        [Op.like]: `%${search}%`
      };
    }

    const stores = await Store.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: stores.rows,
      pagination: {
        total: stores.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(stores.count / limit)
      }
    });
  } catch (error) {
    console.error('Mağazalar listeleme hatası:', error);
    res.status(500).json({ message: 'Mağazalar listelenemedi' });
  }
};

// @desc    Kullanıcının mağazalarını getir
// @route   GET /api/stores/my
// @access  Private (Tradesman)
exports.getMyStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        include: [Category]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Kullanıcı mağazaları getirme hatası:', error);
    res.status(500).json({ message: 'Mağazalar getirilemedi' });
  }
};

// @desc    Mağaza detaylarını getir
// @route   GET /api/stores/:id
// @access  Public
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['name', 'email']
      }, {
        model: Category,
        include: [{
          model: Product,
          where: { isActive: true },
          required: false
        }]
      }]
    });

    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Mağaza detay getirme hatası:', error);
    res.status(500).json({ message: 'Mağaza detayları getirilemedi' });
  }
};

// @desc    Yeni mağaza oluştur
// @route   POST /api/stores
// @access  Private (Tradesman)
exports.createStore = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, address, phone } = req.body;
    
    // Esnaf sadece kendi mağazasını oluşturabilir
    if (req.user.role !== 'tradesman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Sadece esnaflar mağaza oluşturabilir' });
    }

    const storeData = {
      name,
      description,
      address,
      phone,
      userId: req.user.id
    };

    // Eğer resim yüklendiyse
    if (req.file) {
      storeData.logo = req.file.filename;
    }

    const store = await Store.create(storeData);

    res.status(201).json({
      success: true,
      data: store,
      message: 'Mağaza başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Mağaza oluşturma hatası:', error);
    res.status(500).json({ message: 'Mağaza oluşturulamadı' });
  }
};

// @desc    Mağaza güncelle
// @route   PUT /api/stores/:id
// @access  Private (Store Owner)
exports.updateStore = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    // Sadece mağaza sahibi veya admin güncelleyebilir
    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu mağazayı güncelleme yetkiniz yok' });
    }

    const { name, description, address, phone } = req.body;

    const updateData = {
      name: name || store.name,
      description: description || store.description,
      address: address || store.address,
      phone: phone || store.phone
    };

    // Eğer yeni resim yüklendiyse
    if (req.file) {
      updateData.logo = req.file.filename;
    }

    await store.update(updateData);

    res.json({
      success: true,
      data: store,
      message: 'Mağaza başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Mağaza güncelleme hatası:', error);
    res.status(500).json({ message: 'Mağaza güncellenemedi' });
  }
};

// @desc    Mağaza sil
// @route   DELETE /api/stores/:id
// @access  Private (Store Owner)
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    // Sadece mağaza sahibi veya admin silebilir
    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu mağazayı silme yetkiniz yok' });
    }

    await store.destroy();

    res.json({
      success: true,
      message: 'Mağaza başarıyla silindi'
    });
  } catch (error) {
    console.error('Mağaza silme hatası:', error);
    res.status(500).json({ message: 'Mağaza silinemedi' });
  }
};

// @desc    Mağaza açık/kapalı durumunu değiştir
// @route   PATCH /api/stores/:id/toggle-status
// @access  Private (Store Owner)
exports.toggleStoreStatus = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    // Sadece mağaza sahibi durumu değiştirebilir
    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu mağazanın durumunu değiştirme yetkiniz yok' });
    }

    await store.update({ isOpen: !store.isOpen });

    res.json({
      success: true,
      data: store,
      message: `Mağaza ${store.isOpen ? 'açıldı' : 'kapatıldı'}`
    });
  } catch (error) {
    console.error('Mağaza durum değiştirme hatası:', error);
    res.status(500).json({ message: 'Mağaza durumu değiştirilemedi' });
  }
};
