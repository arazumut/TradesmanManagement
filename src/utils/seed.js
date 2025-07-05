const seedDatabase = require('./seeders/seedData');
const db = require('../config/database');

// Veritabanı senkronizasyonu ve seed işlemi
async function init() {
  try {
    // Veritabanı bağlantısını test et
    await db.authenticate();
    console.log('Veritabanı bağlantısı başarılı');
    
    // Tüm tabloları sıfırla (force: true)
    await db.syncDatabase(true);
    
    // Test verilerini oluştur
    await seedDatabase();
    
    console.log('Veritabanı başarıyla hazırlandı!');
    process.exit(0);
  } catch (error) {
    console.error('Veritabanı hazırlama hatası:', error);
    process.exit(1);
  }
}

init();
