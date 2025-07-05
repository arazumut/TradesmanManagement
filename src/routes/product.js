const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: integer
 *           description: Ürün ID'si
 *         name:
 *           type: string
 *           description: Ürün adı
 *         description:
 *           type: string
 *           description: Ürün açıklaması
 *         price:
 *           type: number
 *           description: Ürün fiyatı
 *         stock:
 *           type: integer
 *           description: Stok miktarı
 *         image:
 *           type: string
 *           description: Ürün görseli
 *         isActive:
 *           type: boolean
 *           description: Aktif durumu
 *         categoryId:
 *           type: integer
 *           description: Kategori ID'si
 *         storeId:
 *           type: integer
 *           description: Mağaza ID'si
 */

/**
 * @swagger
 * /api/products/store/{storeId}:
 *   get:
 *     summary: Mağazanın ürünlerini listele
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Kategoriye göre filtrele
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/store/:storeId', productController.getProductsByStore);

/**
 * @swagger
 * /api/products/category/{categoryId}:
 *   get:
 *     summary: Kategoriye göre ürünleri listele
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Ürün arama
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Arama terimi
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *         description: Mağaza ID'si (opsiyonel)
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/search', productController.searchProducts);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Tüm ürünleri listele (Admin için)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Kategoriye göre filtrele
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: integer
 *         description: Mağazaya göre filtrele
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Ürün adına göre ara
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
 *         description: Sayfa başına ürün sayısı
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Yetki hatası
 */
router.get('/', auth, productController.getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Ürün detaylarını getir
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ürün ID'si
 *     responses:
 *       200:
 *         description: Başarılı
 *       404:
 *         description: Ürün bulunamadı
 */
router.get('/:id', auth, productController.getProductById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Yeni ürün oluştur
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *               - storeId
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *               categoryId:
 *                 type: integer
 *               storeId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Ürün başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 */
router.post('/', auth, upload.single('image'), [
  body('name').notEmpty().withMessage('Ürün adı gerekli'),
  body('price').isFloat({ min: 0 }).withMessage('Geçerli bir fiyat girin'),
  body('stock').isInt({ min: 0 }).withMessage('Geçerli bir stok miktarı girin'),
  body('storeId').isInt().withMessage('Mağaza ID gerekli'),
  body('categoryId').isInt().withMessage('Kategori ID gerekli')
], productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Ürün güncelle
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *               categoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ürün başarıyla güncellendi
 *       404:
 *         description: Ürün bulunamadı
 */
router.put('/:id', auth, upload.single('image'), [
  body('name').optional().notEmpty().withMessage('Ürün adı boş olamaz'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Geçerli bir fiyat girin'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Geçerli bir stok miktarı girin'),
  body('categoryId').optional().isInt().withMessage('Geçerli bir kategori ID girin')
], productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Ürün sil
 *     tags: [Products]
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
 *         description: Ürün başarıyla silindi
 *       404:
 *         description: Ürün bulunamadı
 */
router.delete('/:id', auth, productController.deleteProduct);

/**
 * @swagger
 * /api/products/{id}/toggle-status:
 *   patch:
 *     summary: Ürün aktif/pasif durumunu değiştir
 *     tags: [Products]
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
 *         description: Durum başarıyla değiştirildi
 *       404:
 *         description: Ürün bulunamadı
 */
router.patch('/:id/toggle-status', auth, productController.toggleProductStatus);

module.exports = router;