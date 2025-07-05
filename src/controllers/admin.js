const { User, Store, Order, Product, Category, OrderItem } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// @desc    Admin dashboard verileri
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboard = async (req, res) => {
  try {
    // Genel istatistikler
    const totalUsers = await User.count();
    const totalStores = await Store.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalAmount');

    // Bu ayki veriler
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlyOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    const monthlyRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Aktif mağaza sayısı
    const activeStores = await Store.count({
      where: { isOpen: true }
    });

    // Son 7 günün sipariş trendleri
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dailyOrders = await Order.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      });

      const dailyRevenue = await Order.sum('totalAmount', {
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      }) || 0;

      last7Days.push({
        date: startOfDay.toISOString().split('T')[0],
        orders: dailyOrders,
        revenue: dailyRevenue
      });
    }

    // En aktif mağazalar
    // Modeller arası ilişkiler ile ilgili hata olduğu için basitleştirilmiş sorgu
    const topStores = await Store.findAll({
      attributes: ['id', 'name', 'isOpen'],
      limit: 5,
      order: [['id', 'ASC']] // Şimdilik sadece ID'ye göre sırala
    });

    res.json({
      success: true,
      totalUsers,
      totalStores,
      totalOrders,
      totalRevenue: totalRevenue || 0,
      activeStores,
      monthlyOrders,
      monthlyRevenue: monthlyRevenue || 0,
      last7Days,
      topStores,
      recentOrders: await Order.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']]
      }),
      activeStoresList: await Store.findAll({
        where: { isOpen: true },
        limit: 5,
        include: [
          { model: User, attributes: ['id', 'name', 'email'] }
        ]
      })
    });
  } catch (error) {
    console.error('Admin dashboard hatası:', error);
    res.status(500).json({ message: 'Dashboard verileri getirilemedi' });
  }
};

// @desc    Tüm kullanıcıları listele
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [{
        model: Store,
        required: false,
        attributes: ['id', 'name', 'isOpen']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users.rows,
      pagination: {
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Kullanıcıları listeleme hatası:', error);
    res.status(500).json({ message: 'Kullanıcılar listelenemedi' });
  }
};

// @desc    Tüm mağazaları listele
// @route   GET /api/admin/stores
// @access  Private (Admin)
exports.getAllStores = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const stores = await Store.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'name', 'email', 'phone']
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
    console.error('Mağazaları listeleme hatası:', error);
    res.status(500).json({ message: 'Mağazalar listelenemedi' });
  }
};

// @desc    Tüm siparişleri listele
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }, {
        model: Store,
        attributes: ['id', 'name']
      }, {
        model: OrderItem,
        include: [{
          model: Product,
          attributes: ['id', 'name']
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
    console.error('Siparişleri listeleme hatası:', error);
    res.status(500).json({ message: 'Siparişler listelenemedi' });
  }
};

// @desc    Kullanıcıyı yasakla/yasağı kaldır
// @route   PATCH /api/admin/users/:id/ban
// @access  Private (Admin)
exports.toggleUserBan = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Admin kendini yasaklayamaz
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin kullanıcı yasaklanamaz' });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      data: user,
      message: `Kullanıcı ${user.isActive ? 'aktif edildi' : 'yasaklandı'}`
    });
  } catch (error) {
    console.error('Kullanıcı yasaklama hatası:', error);
    res.status(500).json({ message: 'Kullanıcı durumu değiştirilemedi' });
  }
};

// @desc    Mağazayı onayla/onayı kaldır
// @route   PATCH /api/admin/stores/:id/approve
// @access  Private (Admin)
exports.toggleStoreApproval = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Mağaza bulunamadı' });
    }

    // Burada 'isApproved' alanı yok, 'isOpen' kullanıyoruz
    await store.update({ isOpen: !store.isOpen });

    res.json({
      success: true,
      data: store,
      message: `Mağaza ${store.isOpen ? 'onaylandı' : 'onayı kaldırıldı'}`
    });
  } catch (error) {
    console.error('Mağaza onaylama hatası:', error);
    res.status(500).json({ message: 'Mağaza durumu değiştirilemedi' });
  }
};

// @desc    Yeni kullanıcı oluştur (Admin tarafından)
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, phone, role } = req.body;

    // Email zaten kullanılıyor mu kontrol et
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
    }

    // Kullanıcı oluştur
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role
    });

    // Şifreyi çıkararak döndür
    const userData = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      data: userData,
      message: 'Kullanıcı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    res.status(500).json({ message: 'Kullanıcı oluşturulamadı' });
  }
};

// @desc    Genel sistem raporu
// @route   GET /api/admin/reports/overview
// @access  Private (Admin)
exports.getSystemOverview = async (req, res) => {
  try {
    // Kullanıcı istatistikleri
    const userStats = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('role')), 'count']
      ],
      group: ['role']
    });

    // Sipariş durum istatistikleri
    const orderStats = await Order.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'totalRevenue']
      ],
      group: ['status']
    });

    // En çok satan ürünler
    const topProducts = await Product.findAll({
      include: [{
        model: OrderItem,
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        [require('sequelize').fn('SUM', require('sequelize').col('OrderItems.quantity')), 'totalSold'],
        [require('sequelize').fn('SUM', require('sequelize').literal('OrderItems.quantity * OrderItems.price')), 'totalRevenue']
      ],
      group: ['Product.id'],
      order: [[require('sequelize').literal('totalSold'), 'DESC']],
      limit: 10
    });

    // Aylık gelir trendi (son 12 ay)
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const revenue = await Order.sum('totalAmount', {
        where: {
          createdAt: {
            [Op.between]: [startOfMonth, endOfMonth]
          },
          status: { [Op.ne]: 'cancelled' }
        }
      }) || 0;

      monthlyRevenue.push({
        month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        revenue
      });
    }

    res.json({
      success: true,
      data: {
        userStats,
        orderStats,
        topProducts,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Sistem raporu hatası:', error);
    res.status(500).json({ message: 'Sistem raporu oluşturulamadı' });
  }
};