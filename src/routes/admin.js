const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// Admin middleware - sadece admin rolü için
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
  next();
};

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin dashboard verileri
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.get('/dashboard', auth, adminAuth, adminController.getDashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Tüm kullanıcıları listele
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, tradesman, customer]
 *         description: Role göre filtrele
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.get('/users', auth, adminAuth, adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/stores:
 *   get:
 *     summary: Tüm mağazaları listele
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.get('/stores', auth, adminAuth, adminController.getAllStores);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Tüm siparişleri listele
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, preparing, ready, delivered, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.get('/orders', auth, adminAuth, adminController.getAllOrders);

/**
 * @swagger
 * /api/admin/users/{id}/ban:
 *   patch:
 *     summary: Kullanıcıyı yasakla/yasağı kaldır
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.patch('/users/:id/ban', auth, adminAuth, adminController.toggleUserBan);

/**
 * @swagger
 * /api/admin/stores/{id}/approve:
 *   patch:
 *     summary: Mağazayı onayla/onayı kaldır
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Admin yetkisi gerekli
 *       404:
 *         description: Mağaza bulunamadı
 */
router.patch('/stores/:id/approve', auth, adminAuth, adminController.toggleStoreApproval);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Yeni admin kullanıcı oluştur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, tradesman]
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.post('/users', auth, adminAuth, [
  body('name').notEmpty().withMessage('İsim gerekli'),
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('role').isIn(['admin', 'tradesman']).withMessage('Geçerli bir rol seçin')
], adminController.createUser);

/**
 * @swagger
 * /api/admin/reports/overview:
 *   get:
 *     summary: Genel sistem raporu
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Admin yetkisi gerekli
 */
router.get('/reports/overview', auth, adminAuth, adminController.getSystemOverview);

module.exports = router; 