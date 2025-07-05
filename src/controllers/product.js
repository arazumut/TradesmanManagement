const { Product, Category, Store } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Mağazanın ürünlerini listele
// @route   GET /api/products/store/:storeId
// @access  Public
exports.getProductsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { categoryId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      storeId,
      isActive: true
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      include: [{
        model: Category,
        attributes: ['id', 'name']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: products.rows,
      pagination: {
        total: products.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    console.error('Mağaza ürünleri listeleme hatası:', error);
    res.status(500).json({ message: 'Ürünler listelenemedi' });
  }
};

// @desc    Kategoriye göre ürünleri listele
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const products = await Product.findAndCountAll({
      where: {
        categoryId,
        isActive: true
      },
      include: [{
        model: Category,
        attributes: ['id', 'name']
      }, {
        model: Store,
        attributes: ['id', 'name', 'isOpen']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: products.rows,
      pagination: {
        total: products.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    console.error('Kategori ürünleri listeleme hatası:', error);
    res.status(500).json({ message: 'Ürünler listelenemedi' });
  }
};

// @desc    Ürün arama
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res) => {
  try {
    const { q, storeId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: 'Arama terimi gerekli' });
    }

    const whereClause = {
      isActive: true,
      [Op.or]: [
        {
          name: {
            [Op.like]: `%${q}%`
          }
        },
        {
          description: {
            [Op.like]: `%${q}%`
          }
        }
      ]
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      include: [{
        model: Category,
        attributes: ['id', 'name']
      }, {
        model: Store,
        attributes: ['id', 'name', 'isOpen'],
        where: { isOpen: true }
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: products.rows,
      pagination: {
        total: products.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    console.error('Ürün arama hatası:', error);
    res.status(500).json({ message: 'Ürün araması yapılamadı' });
  }
};

// @desc    Tüm ürünleri listele (Admin için)
// @route   GET /api/products
// @access  Private (Admin)
exports.getAllProducts = async (req, res) => {
  try {
    const { categoryId, storeId, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const products = await Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Store, attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      products: products.rows,
      totalPages: Math.ceil(products.count / limit),
      currentPage: parseInt(page),
      totalItems: products.count
    });
  } catch (error) {
    console.error('Ürünleri listeleme hatası:', error);
    res.status(500).json({ message: 'Ürünler listelenemedi' });
  }
};

// @desc    Ürün detaylarını getir
// @route   GET /api/products/:id
// @access  Private
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: Store, attributes: ['id', 'name'] }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.json({
      success: true,
      ...product.dataValues
    });
  } catch (error) {
    console.error('Ürün detayı getirme hatası:', error);
    res.status(500).json({ message: 'Ürün detayları getirilemedi' });
  }
};

// @desc    Yeni ürün oluştur
// @route   POST /api/products
// @access  Private (Store Owner)
exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, stock, categoryId, storeId } = req.body;

    // Mağazanın var olduğunu ve kullanıcının sahibi olduğunu kontrol et
    const store = await Store.findByPk(storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu mağazada ürün oluşturma yetkiniz yok' });
    }

    // Kategori kontrolü
    const category = await Category.findOne({
      where: {
        id: categoryId,
        storeId
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı veya bu mağazaya ait değil' });
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      categoryId: parseInt(categoryId),
      storeId: parseInt(storeId)
    };

    // Eğer resim yüklendiyse
    if (req.file) {
      productData.image = req.file.filename;
    }

    const product = await Product.create(productData);

    // İlişkili verileri de getir
    const productWithDetails = await Product.findByPk(product.id, {
      include: [{
        model: Category,
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json({
      success: true,
      data: productWithDetails,
      message: 'Ürün başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    res.status(500).json({ message: 'Ürün oluşturulamadı' });
  }
};

// @desc    Ürün güncelle
// @route   PUT /api/products/:id
// @access  Private (Store Owner)
exports.updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const product = await Product.findByPk(req.params.id, {
      include: [Store]
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Sadece mağaza sahibi veya admin güncelleyebilir
    if (product.Store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu ürünü güncelleme yetkiniz yok' });
    }

    const { name, description, price, stock, categoryId } = req.body;

    // Eğer kategori değişiyorsa, aynı mağazada olduğunu kontrol et
    if (categoryId && categoryId !== product.categoryId) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          storeId: product.storeId
        }
      });

      if (!category) {
        return res.status(404).json({ message: 'Kategori bulunamadı veya bu mağazaya ait değil' });
      }
    }

    const updateData = {
      name: name || product.name,
      description: description || product.description,
      price: price ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      categoryId: categoryId ? parseInt(categoryId) : product.categoryId
    };

    // Eğer yeni resim yüklendiyse
    if (req.file) {
      updateData.image = req.file.filename;
    }

    await product.update(updateData);

    // Güncellenmiş ürünü ilişkili verilerle getir
    const updatedProduct = await Product.findByPk(product.id, {
      include: [{
        model: Category,
        attributes: ['id', 'name']
      }]
    });

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Ürün başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({ message: 'Ürün güncellenemedi' });
  }
};

// @desc    Ürün sil
// @route   DELETE /api/products/:id
// @access  Private (Store Owner)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [Store]
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Sadece mağaza sahibi veya admin silebilir
    if (product.Store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu ürünü silme yetkiniz yok' });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    res.status(500).json({ message: 'Ürün silinemedi' });
  }
};

// @desc    Ürün aktif/pasif durumunu değiştir
// @route   PATCH /api/products/:id/toggle-status
// @access  Private (Store Owner)
exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [Store]
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Sadece mağaza sahibi durumu değiştirebilir
    if (product.Store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu ürünün durumunu değiştirme yetkiniz yok' });
    }

    await product.update({ isActive: !product.isActive });

    res.json({
      success: true,
      data: product,
      message: `Ürün ${product.isActive ? 'aktif edildi' : 'pasif edildi'}`
    });
  } catch (error) {
    console.error('Ürün durum değiştirme hatası:', error);
    res.status(500).json({ message: 'Ürün durumu değiştirilemedi' });
  }
};