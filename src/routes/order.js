const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - items
 *         - storeId
 *       properties:
 *         id:
 *           type: integer
 *           description: Sipariş ID'si
 *         orderNumber:
 *           type: string
 *           description: Sipariş numarası
 *         status:
 *           type: string
 *           enum: [pending, preparing, ready, delivered, cancelled]
 *           description: Sipariş durumu
 *         totalAmount:
 *           type: number
 *           description: Toplam tutar
 *         deliveryAddress:
 *           type: string
 *           description: Teslimat adresi
 *         notes:
 *           type: string
 *           description: Sipariş notları
 *         userId:
 *           type: integer
 *           description: Müşteri ID'si
 *         storeId:
 *           type: integer
 *           description: Mağaza ID'si
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         price:
 *           type: number
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - items
 *         - storeId
 *         - deliveryAddress
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         storeId:
 *           type: integer
 *         deliveryAddress:
 *           type: string
 *         notes:
 *           type: string
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Kullanıcının siparişlerini listele
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, preparing, ready, delivered, cancelled]
 *         description: Duruma göre filtrele
 *     responses:
 *       200:
 *         description: Başarılı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/', auth, orderController.getUserOrders);

/**
 * @swagger
 * /api/orders/store/{storeId}:
 *   get:
 *     summary: Mağazanın siparişlerini listele
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, preparing, ready, delivered, cancelled]
 *         description: Duruma göre filtrele
 *     responses:
 *       200:
 *         description: Başarılı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/store/:storeId', auth, orderController.getStoreOrders);

/**
 * @swagger
 * /orders/reports/daily:
 *   get:
 *     summary: Günlük sipariş raporu
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tarih (YYYY-MM-DD formatında)
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/reports/daily', auth, orderController.getDailyReport);

/**
 * @swagger
 * /orders/reports/monthly:
 *   get:
 *     summary: Aylık sipariş raporu
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/reports/monthly', auth, orderController.getMonthlyReport);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Sipariş detaylarını getir
 *     tags: [Orders]
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
 *       404:
 *         description: Sipariş bulunamadı
 */
router.get('/:id', auth, orderController.getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Yeni sipariş oluştur
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Sipariş başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 */
router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('En az bir ürün seçilmeli'),
  body('items.*.productId').isInt().withMessage('Geçerli ürün ID gerekli'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Geçerli miktar gerekli'),
  body('storeId').isInt().withMessage('Mağaza ID gerekli'),
  body('deliveryAddress').notEmpty().withMessage('Teslimat adresi gerekli')
], orderController.createOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Sipariş durumunu güncelle
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, preparing, ready, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Durum başarıyla güncellendi
 *       404:
 *         description: Sipariş bulunamadı
 */
router.patch('/:id/status', auth, [
  body('status').isIn(['pending', 'preparing', 'ready', 'delivered', 'cancelled']).withMessage('Geçerli durum seçin')
], orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Siparişi iptal et
 *     tags: [Orders]
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
 *         description: Sipariş başarıyla iptal edildi
 *       400:
 *         description: Sipariş iptal edilemez
 *       404:
 *         description: Sipariş bulunamadı
 */
router.patch('/:id/cancel', auth, orderController.cancelOrder);

module.exports = router;