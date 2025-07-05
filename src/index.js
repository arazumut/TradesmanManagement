const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Model ve Database
const db = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const storeRoutes = require('./routes/store');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');

// Config
dotenv.config();

// Express App
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Swagger seçenekleri
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Esnaf Sipariş Yönetim API',
      version: '1.0.0',
      description: 'Esnaf Paneli ve Mobil Sipariş Uygulaması için API Dökümantasyonu',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // routes dosyalarındaki açıklamaları kullanacak
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Socket.IO bağlantısı
io.on('connection', (socket) => {
  console.log('Yeni bir bağlantı kuruldu:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Bağlantı kesildi:', socket.id);
  });
});

// Global olarak io nesnesini kullanabilmek için
app.set('io', io);

// API Routes
app.use('/api', [
  { path: '/auth', router: authRoutes },
  { path: '/users', router: userRoutes },
  { path: '/stores', router: storeRoutes },
  { path: '/products', router: productRoutes },
  { path: '/categories', router: categoryRoutes },
  { path: '/orders', router: orderRoutes },
  { path: '/admin', router: adminRoutes }
].reduce((app, route) => {
  app.use(route.path, route.router);
  return app;
}, express.Router()));

// Ana sayfa
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// API sayfası
app.get('/api', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// 404 - Not Found
app.use((req, res) => {
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// Veritabanı bağlantısı ve server başlatma
const PORT = process.env.PORT || 3000;

// Veritabanını senkronize et (force: false = var olan tabloları silmez)
const force = process.env.DB_FORCE === 'true'; // .env'den force değerini al
db.syncDatabase(force)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor...`);
    });
  })
  .catch(err => {
    console.error('Veritabanı senkronizasyon hatası:', err);
  });
