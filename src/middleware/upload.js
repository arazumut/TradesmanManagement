const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Yükleme dizinini kontrol et ve oluştur
const checkUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Dosya yükleme yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    checkUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluşturma
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Dosya türü filtresi
const fileFilter = (req, file, cb) => {
  // İzin verilen dosya türleri
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  
  // Dosya uzantısını kontrol et
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  
  // MIME türünü kontrol et
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

// Multer konfigürasyonu
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB maksimum dosya boyutu
  }
});

module.exports = upload;
