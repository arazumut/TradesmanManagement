const { Category, Store } = require('../models');
const { validationResult } = require('express-validator');

// @desc    Kategori oluştur
// @route   POST /api/categories
// @access  Private (tradesman only)
exports.createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description } = req.body;
    const { storeId } = req.body;

    // Mağaza var mı ve kullanıcıya ait mi kontrol et
    const store = await Store.findByPk(storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Kategori oluştur
    const category = await Category.create({
      name,
      description,
      storeId,
      icon: req.file ? req.file.filename : null
    });

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    res.status(500).json({ message: 'Kategori oluşturulurken hata oluştu' });
  }
};

// @desc    Kategori güncelle
// @route   PUT /api/categories/:id
// @access  Private (store owner or admin)
exports.updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Mağaza sahibi mi kontrol et
    const store = await Store.findByPk(category.storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const { name, description } = req.body;

    // Alanları güncelle
    if (name) category.name = name;
    if (description) category.description = description;
    
    // İkon güncellemesi
    if (req.file) {
      category.icon = req.file.filename;
    }

    await category.save();

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error);
    res.status(500).json({ message: 'Kategori güncellenirken hata oluştu' });
  }
};

// @desc    Kategori sil
// @route   DELETE /api/categories/:id
// @access  Private (store owner or admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }

    // Mağaza sahibi mi kontrol et
    const store = await Store.findByPk(category.storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({ message: 'Kategori silinirken hata oluştu' });
  }
};

// @desc    Mağazaya ait kategorileri getir
// @route   GET /api/categories/store/:storeId
// @access  Public
exports.getStoreCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { storeId: req.params.storeId },
      attributes: ['id', 'name', 'description', 'icon']
    });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Kategorileri getirme hatası:', error);
    res.status(500).json({ message: 'Kategoriler getirilirken hata oluştu' });
  }
};

// @desc    Mağazanın kategorilerini listele
// @route   GET /api/categories/store/:storeId
// @access  Public
exports.getCategoriesByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Mağaza var mı kontrol et
    const storeExists = await Store.findByPk(storeId);
    
    if (!storeExists) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }
    
    // Mağazanın kategorilerini getir
    const categories = await Category.findAll({
      where: { storeId },
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Kategori listeleme hatası:', error);
    res.status(500).json({ message: 'Kategoriler listelenirken hata oluştu' });
  }
};

// @desc    Kategori detaylarını getir
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Kategori detay hatası:', error);
    res.status(500).json({ message: 'Kategori bilgileri alınırken hata oluştu' });
  }
};
