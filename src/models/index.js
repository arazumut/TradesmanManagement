const User = require('./User');
const Store = require('./Store');
const Category = require('./Category');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// User - Store ilişkisi (Bir mağazanın bir sahibi olabilir)
User.hasMany(Store, { foreignKey: 'userId' });
Store.belongsTo(User, { foreignKey: 'userId' });

// Store - Product ilişkisi (Bir mağazanın birden fazla ürünü olabilir)
Store.hasMany(Product, { foreignKey: 'storeId' });
Product.belongsTo(Store, { foreignKey: 'storeId' });

// Category - Product ilişkisi (Bir kategorinin birden fazla ürünü olabilir)
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Store - Category ilişkisi (Bir mağazanın birden fazla kategorisi olabilir)
Store.hasMany(Category, { foreignKey: 'storeId' });
Category.belongsTo(Store, { foreignKey: 'storeId' });

// User - Order ilişkisi (Bir kullanıcının birden fazla siparişi olabilir)
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// Store - Order ilişkisi (Bir mağazanın birden fazla siparişi olabilir)
Store.hasMany(Order, { foreignKey: 'storeId' });
Order.belongsTo(Store, { foreignKey: 'storeId' });

// Order - OrderItem ilişkisi (Bir siparişin birden fazla sipariş kalemi olabilir)
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product - OrderItem ilişkisi (Bir sipariş kalemi bir ürüne ait olabilir)
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

module.exports = {
  User,
  Store,
  Category,
  Product,
  Order,
  OrderItem
};
