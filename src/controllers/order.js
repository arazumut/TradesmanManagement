const { Order, OrderItem, Product, User, Store, Category } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Sipariş numarası oluştur
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SIP${year}${month}${day}${random}`;
};

// @desc    Kullanıcının siparişlerini listele
// @route   GET /api/orders
// @access  Private (Customer)
exports.getUserOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      userId: req.user.id
    };

    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: Store,
        attributes: ['id', 'name', 'address', 'phone']
      }, {
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'image']
        }]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: orders.rows,
      pagination: {
        total: orders.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(orders.count / limit)
      }
    });
  } catch (error) {
    console.error('Kullanıcı siparişleri listeleme hatası:', error);
    res.status(500).json({ message: 'Siparişler listelenemedi' });
  }
};

// @desc    Mağazanın siparişlerini listele
// @route   GET /api/orders/store/:storeId
// @access  Private (Store Owner)
exports.getStoreOrders = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Mağaza sahipliği kontrolü
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu mağazanın siparişlerini görme yetkiniz yok' });
    }

    const whereClause = {
      storeId
    };

    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'name', 'phone', 'email']
      }, {
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'price', 'image']
        }]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: orders.rows,
      pagination: {
        total: orders.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(orders.count / limit)
      }
    });
  } catch (error) {
    console.error('Mağaza siparişleri listeleme hatası:', error);
    res.status(500).json({ message: 'Siparişler listelenemedi' });
  }
};

// @desc    Sipariş detaylarını getir
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'phone', 'email']
      }, {
        model: Store,
        attributes: ['id', 'name', 'address', 'phone']
      }, {
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'price', 'image']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    // Sadece sipariş sahibi, mağaza sahibi veya admin görebilir
    const store = await Store.findByPk(order.storeId);
    if (
      order.userId !== req.user.id && 
      store.userId !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Bu siparişi görme yetkiniz yok' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Sipariş detay getirme hatası:', error);
    res.status(500).json({ message: 'Sipariş detayları getirilemedi' });
  }
};

// @desc    Yeni sipariş oluştur
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { items, storeId, deliveryAddress, notes } = req.body;

    // Mağaza kontrolü
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (!store.isOpen) {
      return res.status(400).json({ message: 'Mağaza şu anda kapalı' });
    }

    // Ürünleri kontrol et ve toplam tutarı hesapla
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: {
          id: item.productId,
          storeId,
          isActive: true
        }
      });

      if (!product) {
        return res.status(404).json({ 
          message: `Ürün bulunamadı veya aktif değil: ${item.productId}` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Yetersiz stok: ${product.name} (Mevcut: ${product.stock})` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Sipariş oluştur
    const orderNumber = generateOrderNumber();
    
    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      storeId,
      totalAmount,
      deliveryAddress,
      notes: notes || null,
      status: 'pending'
    });

    // Sipariş kalemlerini oluştur ve stokları güncelle
    for (let i = 0; i < orderItems.length; i++) {
      await OrderItem.create({
        orderId: order.id,
        productId: orderItems[i].productId,
        quantity: orderItems[i].quantity,
        price: orderItems[i].price
      });

      // Stok güncelle
      await Product.decrement('stock', {
        by: orderItems[i].quantity,
        where: { id: orderItems[i].productId }
      });
    }

    // Sipariş detaylarını getir
    const orderWithDetails = await Order.findByPk(order.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'address', 'phone']
      }, {
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name', 'image']
        }]
      }]
    });

    // Socket ile mağaza sahibine bildirim gönder
    const io = req.app.get('io');
    if (io) {
      io.emit(`store_${storeId}`, {
        type: 'new_order',
        order: orderWithDetails,
        message: 'Yeni sipariş alındı'
      });
    }

    res.status(201).json({
      success: true,
      data: orderWithDetails,
      message: 'Sipariş başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({ message: 'Sipariş oluşturulamadı' });
  }
};

// @desc    Sipariş durumunu güncelle
// @route   PATCH /api/orders/:id/status
// @access  Private (Store Owner)
exports.updateOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id, {
      include: [Store]
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    // Sadece mağaza sahibi veya admin durumu değiştirebilir
    if (order.Store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu siparişin durumunu değiştirme yetkiniz yok' });
    }

    // İptal edilmiş siparişin durumu değiştirilemez
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'İptal edilmiş sipariş durumu değiştirilemez' });
    }

    // Teslim edilmiş siparişin durumu değiştirilemez
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Teslim edilmiş sipariş durumu değiştirilemez' });
    }

    await order.update({ status });

    // Socket ile müşteriye bildirim gönder
    const io = req.app.get('io');
    if (io) {
      io.emit(`user_${order.userId}`, {
        type: 'order_status_update',
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
        message: `Sipariş durumu güncellendi: ${status}`
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Sipariş durumu başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Sipariş durum güncelleme hatası:', error);
    res.status(500).json({ message: 'Sipariş durumu güncellenemedi' });
  }
};

// @desc    Siparişi iptal et
// @route   PATCH /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [Store, OrderItem]
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    // Sadece sipariş sahibi, mağaza sahibi veya admin iptal edebilir
    if (
      order.userId !== req.user.id && 
      order.Store.userId !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Bu siparişi iptal etme yetkiniz yok' });
    }

    // Sadece bekleyen veya hazırlanıyor durumundaki siparişler iptal edilebilir
    if (!['pending', 'preparing'].includes(order.status)) {
      return res.status(400).json({ message: 'Bu aşamada sipariş iptal edilemez' });
    }

    // Stokları geri ver
    for (const item of order.OrderItems) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }

    await order.update({ status: 'cancelled' });

    // Socket bildirimleri
    const io = req.app.get('io');
    if (io) {
      // Müşteriye bildirim
      io.emit(`user_${order.userId}`, {
        type: 'order_cancelled',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Sipariş iptal edildi'
      });

      // Mağaza sahibine bildirim
      io.emit(`store_${order.storeId}`, {
        type: 'order_cancelled',
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Sipariş iptal edildi'
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Sipariş başarıyla iptal edildi'
    });
  } catch (error) {
    console.error('Sipariş iptal etme hatası:', error);
    res.status(500).json({ message: 'Sipariş iptal edilemedi' });
  }
};

// @desc    Günlük sipariş raporu
// @route   GET /api/orders/reports/daily
// @access  Private (Store Owner)
exports.getDailyReport = async (req, res) => {
  try {
    const { storeId, date } = req.query;

    if (!storeId) {
      return res.status(400).json({ message: 'Mağaza ID gerekli' });
    }

    // Mağaza sahipliği kontrolü
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu raporu görme yetkiniz yok' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await Order.findAll({
      where: {
        storeId,
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [OrderItem]
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      ordersByStatus: {},
      cancelledOrders: 0,
      averageOrderValue: 0
    };

    // Durum bazında sipariş sayıları
    orders.forEach(order => {
      if (!stats.ordersByStatus[order.status]) {
        stats.ordersByStatus[order.status] = 0;
      }
      stats.ordersByStatus[order.status]++;

      if (order.status === 'cancelled') {
        stats.cancelledOrders++;
      }
    });

    // Ortalama sipariş değeri
    if (stats.totalOrders > 0) {
      stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;
    }

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        stats,
        orders
      }
    });
  } catch (error) {
    console.error('Günlük rapor hatası:', error);
    res.status(500).json({ message: 'Günlük rapor oluşturulamadı' });
  }
};

// @desc    Aylık sipariş raporu
// @route   GET /api/orders/reports/monthly
// @access  Private (Store Owner)
exports.getMonthlyReport = async (req, res) => {
  try {
    const { storeId, year, month } = req.query;

    if (!storeId) {
      return res.status(400).json({ message: 'Mağaza ID gerekli' });
    }

    // Mağaza sahipliği kontrolü
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    if (store.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu raporu görme yetkiniz yok' });
    }

    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const orders = await Order.findAll({
      where: {
        storeId,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      include: [OrderItem]
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      ordersByStatus: {},
      cancelledOrders: 0,
      averageOrderValue: 0,
      dailyBreakdown: {}
    };

    // Durum bazında sipariş sayıları ve günlük dağılım
    orders.forEach(order => {
      if (!stats.ordersByStatus[order.status]) {
        stats.ordersByStatus[order.status] = 0;
      }
      stats.ordersByStatus[order.status]++;

      if (order.status === 'cancelled') {
        stats.cancelledOrders++;
      }

      // Günlük dağılım
      const day = order.createdAt.getDate();
      if (!stats.dailyBreakdown[day]) {
        stats.dailyBreakdown[day] = {
          orders: 0,
          revenue: 0
        };
      }
      stats.dailyBreakdown[day].orders++;
      stats.dailyBreakdown[day].revenue += order.totalAmount;
    });

    // Ortalama sipariş değeri
    if (stats.totalOrders > 0) {
      stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;
    }

    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        stats
      }
    });
  } catch (error) {
    console.error('Aylık rapor hatası:', error);
    res.status(500).json({ message: 'Aylık rapor oluşturulamadı' });
  }
}; 