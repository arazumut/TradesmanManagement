const bcrypt = require('bcryptjs');
const { User, Store, Category, Product } = require('../../models');

// Admin kullanıcı oluştur
async function createAdmin() {
  try {
    // Admin var mı kontrol et
    const adminExists = await User.findOne({
      where: { email: 'admin@tradesman.com' }
    });

    if (adminExists) {
      console.log('Admin kullanıcı zaten mevcut');
      return adminExists;
    }

    // Admin yoksa oluştur
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@tradesman.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    console.log('Admin kullanıcı oluşturuldu');
    return admin;
  } catch (error) {
    console.error('Admin oluşturma hatası:', error);
    throw error;
  }
}

// Örnek esnaf kullanıcı oluştur
async function createTradesman() {
  try {
    // Esnaf var mı kontrol et
    const tradesmanExists = await User.findOne({
      where: { email: 'esnaf@tradesman.com' }
    });

    if (tradesmanExists) {
      console.log('Esnaf kullanıcı zaten mevcut');
      return tradesmanExists;
    }

    // Esnaf yoksa oluştur
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('esnaf123', salt);

    const tradesman = await User.create({
      name: 'Örnek Esnaf',
      email: 'esnaf@tradesman.com',
      password: hashedPassword,
      phone: '05551234567',
      role: 'tradesman',
      isActive: true
    });

    console.log('Esnaf kullanıcı oluşturuldu');
    return tradesman;
  } catch (error) {
    console.error('Esnaf oluşturma hatası:', error);
    throw error;
  }
}

// Örnek müşteri kullanıcı oluştur
async function createCustomer() {
  try {
    // Müşteri var mı kontrol et
    const customerExists = await User.findOne({
      where: { email: 'musteri@tradesman.com' }
    });

    if (customerExists) {
      console.log('Müşteri kullanıcı zaten mevcut');
      return customerExists;
    }

    // Müşteri yoksa oluştur
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('musteri123', salt);

    const customer = await User.create({
      name: 'Örnek Müşteri',
      email: 'musteri@tradesman.com',
      password: hashedPassword,
      phone: '05559876543',
      role: 'customer',
      address: 'Örnek Mahallesi, Örnek Sokak No:1, Örnek/İstanbul',
      isActive: true
    });

    console.log('Müşteri kullanıcı oluşturuldu');
    return customer;
  } catch (error) {
    console.error('Müşteri oluşturma hatası:', error);
    throw error;
  }
}

// Örnek mağaza oluştur
async function createStore(tradesmanId) {
  try {
    // Mağaza var mı kontrol et
    const storeExists = await Store.findOne({
      where: { name: 'Örnek Market' }
    });

    if (storeExists) {
      console.log('Örnek mağaza zaten mevcut');
      return storeExists;
    }

    // Mağaza yoksa oluştur
    const store = await Store.create({
      name: 'Örnek Market',
      description: 'Örnek bir market mağazası',
      address: 'Örnek Mahallesi, Örnek Sokak No:10, Örnek/İstanbul',
      phone: '02121234567',
      isOpen: true,
      userId: tradesmanId
    });

    console.log('Örnek mağaza oluşturuldu');
    return store;
  } catch (error) {
    console.error('Mağaza oluşturma hatası:', error);
    throw error;
  }
}

// Örnek kategoriler oluştur
async function createCategories(storeId) {
  try {
    const categories = [
      { name: 'Sebze & Meyve', storeId },
      { name: 'Süt Ürünleri', storeId },
      { name: 'İçecekler', storeId },
      { name: 'Temizlik', storeId }
    ];

    for (const category of categories) {
      const existingCategory = await Category.findOne({
        where: { name: category.name, storeId }
      });

      if (!existingCategory) {
        await Category.create(category);
        console.log(`"${category.name}" kategorisi oluşturuldu`);
      } else {
        console.log(`"${category.name}" kategorisi zaten mevcut`);
      }
    }

    console.log('Kategoriler oluşturuldu');
    return await Category.findAll({ where: { storeId } });
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    throw error;
  }
}

// Örnek ürünler oluştur
async function createProducts(storeId, categories) {
  try {
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category.id;
    });

    const products = [
      {
        name: 'Elma',
        description: 'Taze kırmızı elma',
        price: 15.99,
        stock: 50,
        image: 'elma.jpg',
        storeId,
        categoryId: categoryMap['Sebze & Meyve']
      },
      {
        name: 'Süt',
        description: 'Günlük taze süt, 1L',
        price: 25.50,
        stock: 30,
        image: 'sut.jpg',
        storeId,
        categoryId: categoryMap['Süt Ürünleri']
      },
      {
        name: 'Maden Suyu',
        description: 'Sade maden suyu, 6x200ml',
        price: 35.99,
        stock: 40,
        image: 'madensuyu.jpg',
        storeId,
        categoryId: categoryMap['İçecekler']
      },
      {
        name: 'Bulaşık Deterjanı',
        description: 'Konsantre bulaşık deterjanı, 750ml',
        price: 49.90,
        stock: 25,
        image: 'deterjan.jpg',
        storeId,
        categoryId: categoryMap['Temizlik']
      }
    ];

    for (const product of products) {
      const existingProduct = await Product.findOne({
        where: { name: product.name, storeId }
      });

      if (!existingProduct) {
        await Product.create(product);
        console.log(`"${product.name}" ürünü oluşturuldu`);
      } else {
        console.log(`"${product.name}" ürünü zaten mevcut`);
      }
    }

    console.log('Ürünler oluşturuldu');
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    throw error;
  }
}

// Ana seed fonksiyonu
async function seed() {
  try {
    console.log('Veritabanı seed işlemi başlatılıyor...');

    // Kullanıcıları oluştur
    const admin = await createAdmin();
    const tradesman = await createTradesman();
    const customer = await createCustomer();

    // Mağaza oluştur
    const store = await createStore(tradesman.id);

    // Kategorileri oluştur
    const categories = await createCategories(store.id);

    // Ürünleri oluştur
    await createProducts(store.id, categories);

    console.log('Seed işlemi başarıyla tamamlandı!');
    return true;
  } catch (error) {
    console.error('Seed hatası:', error);
    return false;
  }
}

// Modül olarak dışa aktar
module.exports = seed;
