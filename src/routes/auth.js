const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { body } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: Kullanıcı ID'si
 *         name:
 *           type: string
 *           description: Kullanıcı adı
 *         email:
 *           type: string
 *           description: E-posta adresi
 *         password:
 *           type: string
 *           description: Şifre
 *         phone:
 *           type: string
 *           description: Telefon numarası
 *         role:
 *           type: string
 *           enum: [admin, tradesman, customer]
 *           description: Kullanıcı rolü
 *         address:
 *           type: string
 *           description: Adres
 *         isActive:
 *           type: boolean
 *           description: Aktif durumu
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           enum: [tradesman, customer]
 *         address:
 *           type: string
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Kullanıcı kaydı
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Başarılı kayıt
 *       400:
 *         description: Geçersiz veri
 */
router.post('/register', [
  body('name').notEmpty().withMessage('İsim gerekli'),
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('role').isIn(['tradesman', 'customer']).withMessage('Geçerli bir rol seçin')
], authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *       401:
 *         description: Geçersiz kimlik bilgileri
 */
router.post('/login', [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password').notEmpty().withMessage('Şifre gerekli')
], authController.login);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Admin girişi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Başarılı admin girişi
 *       401:
 *         description: Geçersiz kimlik bilgileri
 */
router.post('/admin/login', [
  body('email').isEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password').notEmpty().withMessage('Şifre gerekli')
], authController.adminLogin);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Token doğrulama
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Geçerli token
 *       401:
 *         description: Geçersiz token
 */
router.get('/verify', authController.verifyToken);

module.exports = router; 