const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite veritabanı bağlantısı
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false, // konsolda SQL sorgularını göstermemek için
});

// Bağlantıyı test etmek için
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    return false;
  }
}

// Veritabanını senkronize et
async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log('Veritabanı tabloları oluşturuldu');
    return true;
  } catch (error) {
    console.error('Veritabanı senkronizasyon hatası:', error);
    return false;
  }
}

testConnection();

module.exports = sequelize;
module.exports.syncDatabase = syncDatabase;
