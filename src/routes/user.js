const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Kullanıcı profilini getir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/profile', auth, userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Kullanıcı profilini güncelle
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Başarıyla güncellendi
 *       401:
 *         description: Yetkisiz erişim
 */
router.put('/profile', auth, [
  body('name').optional().notEmpty().withMessage('İsim boş olamaz'),
  body('phone').optional().notEmpty().withMessage('Telefon numarası boş olamaz')
], userController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Şifre değiştir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Şifre başarıyla değiştirildi
 *       400:
 *         description: Mevcut şifre yanlış
 */
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Mevcut şifre gerekli'),
  body('newPassword').isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalı')
], userController.changePassword);

/**
 * @swagger
 * /users/orders:
 *   get:
 *     summary: Kullanıcı siparişlerini getir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına öğe sayısı
 *     responses:
 *       200:
 *         description: Başarılı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/orders', auth, userController.getUserOrders);

module.exports = router;