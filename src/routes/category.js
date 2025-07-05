const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Kategori ID'si
 *         name:
 *           type: string
 *           description: Kategori adı
 *         description:
 *           type: string
 *           description: Kategori açıklaması
 *         storeId:
 *           type: integer
 *           description: Mağaza ID'si
 */

/**
 * @swagger
 * /api/categories/store/{storeId}:
 *   get:
 *     summary: Mağazanın kategorilerini listele
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/store/:storeId', categoryController.getCategoriesByStore);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Kategori detaylarını getir
 *     tags: [Categories]
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
 *         description: Kategori bulunamadı
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Yeni kategori oluştur
 *     tags: [Categories]
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
 *               - storeId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               storeId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Kategori başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 */
router.post('/', auth, [
  body('name').notEmpty().withMessage('Kategori adı gerekli'),
  body('storeId').isInt().withMessage('Mağaza ID gerekli')
], categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Kategori güncelle
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kategori başarıyla güncellendi
 *       404:
 *         description: Kategori bulunamadı
 */
router.put('/:id', auth, [
  body('name').optional().notEmpty().withMessage('Kategori adı boş olamaz')
], categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Kategori sil
 *     tags: [Categories]
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
 *         description: Kategori başarıyla silindi
 *       404:
 *         description: Kategori bulunamadı
 */
router.delete('/:id', auth, categoryController.deleteCategory);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Tüm kategorileri listele
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Sayfa başına kategori sayısı
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Arama terimi
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/', categoryController.getAllCategories);

module.exports = router;