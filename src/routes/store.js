const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - address
 *       properties:
 *         id:
 *           type: integer
 *           description: Mağaza ID'si
 *         name:
 *           type: string
 *           description: Mağaza adı
 *         description:
 *           type: string
 *           description: Mağaza açıklaması
 *         address:
 *           type: string
 *           description: Mağaza adresi
 *         phone:
 *           type: string
 *           description: Telefon numarası
 *         image:
 *           type: string
 *           description: Mağaza görseli
 *         isOpen:
 *           type: boolean
 *           description: Açık/kapalı durumu
 *         userId:
 *           type: integer
 *           description: Mağaza sahibi ID'si
 */

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Tüm mağazaları listele (müşteriler için)
 *     tags: [Stores]
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.get('/', storeController.getAllStores);

/**
 * @swagger
 * /api/stores/my:
 *   get:
 *     summary: Kullanıcının mağazalarını getir
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/my', auth, storeController.getMyStores);

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Mağaza detaylarını getir
 *     tags: [Stores]
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
 *         description: Mağaza bulunamadı
 */
router.get('/:id', storeController.getStoreById);

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Yeni mağaza oluştur
 *     tags: [Stores]
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
 *               - description
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Mağaza başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 */
router.post('/', auth, upload.single('image'), [
  body('name').notEmpty().withMessage('Mağaza adı gerekli'),
  body('description').notEmpty().withMessage('Açıklama gerekli'),
  body('address').notEmpty().withMessage('Adres gerekli')
], storeController.createStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Mağaza güncelle
 *     tags: [Stores]
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
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Mağaza başarıyla güncellendi
 *       404:
 *         description: Mağaza bulunamadı
 */
router.put('/:id', auth, upload.single('image'), [
  body('name').optional().notEmpty().withMessage('Mağaza adı boş olamaz'),
  body('description').optional().notEmpty().withMessage('Açıklama boş olamaz'),
  body('address').optional().notEmpty().withMessage('Adres boş olamaz')
], storeController.updateStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Mağaza sil
 *     tags: [Stores]
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
 *         description: Mağaza başarıyla silindi
 *       404:
 *         description: Mağaza bulunamadı
 */
router.delete('/:id', auth, storeController.deleteStore);

/**
 * @swagger
 * /api/stores/{id}/toggle-status:
 *   patch:
 *     summary: Mağaza açık/kapalı durumunu değiştir
 *     tags: [Stores]
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
 *         description: Mağaza bulunamadı
 */
router.patch('/:id/toggle-status', auth, storeController.toggleStoreStatus);

module.exports = router; 