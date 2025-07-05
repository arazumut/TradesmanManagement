# ✅ Proje Görev Listesi – Esnaf Paneli + Mobil Sipariş Uygulaması

Node.js

---

## 1. Kullanıcı Yönetimi
- [ ] Admin (platform sahibi) giriş sistemi
- [ ] Esnaf kayıt ve giriş (kendi dükkanını yöneten kullanıcı)
- [ ] Müşteri kayıt ve giriş (API üzerinden, mobil için)
- [ ] JWT tabanlı authentication sistemi (login + protected route)

---

## 2. Mağaza Yönetimi (Esnaf Paneli)
- [ ] Mağaza oluşturma
- [ ] Mağaza düzenleme
- [ ] Mağaza silme
- [ ] Her mağazaya bir esnaf atanması
- [ ] Mağaza açık/kapalı durumu yönetimi

---

## 3. Ürün Yönetimi
- [ ] Ürün ekleme (isim, açıklama, fiyat, stok, resim)
- [ ] Ürün düzenleme
- [ ] Ürün silme
- [ ] Ürün kategorisi oluşturma (sebze, içecek, temizlik vb.)
- [ ] Ürünleri kategoriye göre gruplama
- [ ] Ürün görseli yükleme (local veya S3/Cloudinary)

---

## 4. Sipariş Sistemi
- [ ] Müşteri sipariş oluşturur (API ile)
- [ ] Sipariş esnafa düşer (panelde listelenir)
- [ ] Sipariş durum güncellemeleri:  
  - Bekliyor  
  - Hazırlanıyor  
  - Yolda  
  - Teslim Edildi  
  - İptal
- [ ] Sipariş detayları gösterimi (ürünler, toplam fiyat, müşteri adı/adresi vs.)

---

## 5. Bildirim & Durum Güncellemeleri (Opsiyonel)
- [ ] Sipariş durumu değişince mobil uygulamaya notification (socket.io veya FCM)
- [ ] Yeni sipariş geldiğinde esnafa anlık bildirim gönderme

---

## 6. Raporlama (Esnaf Paneli)
- [ ] Günlük sipariş sayısı ve toplam gelir
- [ ] Haftalık/aylık sipariş istatistikleri
- [ ] En çok satılan ürünlerin listelenmesi
- [ ] Sipariş iptal oranı analizi

---

## 7. Admin Özellikleri (Platform Sahibi için)
- [ ] Tüm mağazaları görüntüleme
- [ ] Tüm kullanıcıları görüntüleme
- [ ] Kötü niyetli kullanıcıları banlama
- [ ] Mağaza başına komisyon oranı tanımlama (opsiyonel, ödeme altyapısı için)

---

## 🛠 Teknikler / Stack
- Node.js (Express.js veya Fastify)
- SQLite (veritabanı)
- JWT Authentication
- Swagger (veya OpenAPI dökümantasyonu)
- Multer (veya Cloudinary/S3) — Dosya yükleme

