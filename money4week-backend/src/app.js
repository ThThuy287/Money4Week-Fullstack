const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// THÊM DÒNG NÀY: Import kết nối Database để đánh thức Neon
const { getPool } = require('./config/db');

const errorHandler = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const transactionRoutes = require('./routes/transaction.routes');
const walletRoutes = require('./routes/wallet.routes');
const reminderRoutes = require('./routes/reminder.routes');
const noteRoutes = require('./routes/note.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const categoryRoutes = require('./routes/category.routes');
const rateLimit = require('express-rate-limit');

const app = express();

// ==========================================
// SECURITY & PERFORMANCE MIDDLEWARES (PRODUCTION)
// ==========================================
app.use(helmet()); // 🛡️ Ẩn thông tin Express, chống XSS, clickjacking
app.use(compression()); // 📦 Nén Response (Gzip) giảm dung lượng tải

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.set('trust proxy', 1);

// Cấu hình CORS chặt chẽ: Chỉ cho phép Localhost và Domain Vercel sau này
const allowedOrigins = [
  'http://localhost:5173', // Frontend chạy dưới Local
  process.env.FRONTEND_URL // Sẽ cấu hình trên Render sau khi có link Vercel
];

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép requests không có origin (ví dụ: Postman) hoặc origin nằm trong danh sách trắng
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Khóa truy cập bởi chính sách CORS (Chỉ cấp phép cho Frontend hợp lệ)'));
    }
  },
  credentials: true // Cho phép gửi Token/Cookie
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' } }
});
app.use('/api', globalLimiter);

// Lớp giáp 2: Khắt khe với API Đăng nhập / Đăng ký (Chống dò mật khẩu)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 15,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Bạn đã thao tác đăng nhập/đăng ký quá nhiều lần. Bị khóa tạm thời 10 phút.' } }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ==========================================
// MOUNT ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);

// ==========================================
// ENDPOINT ĐÁNH THỨC SERVER & DATABASE (UPTIMEROBOT)
// Đặt NGAY TRƯỚC khối bắt lỗi 404
// ==========================================
app.get('/api/ping', async (req, res) => {
  try {
    // Chạy một câu lệnh SQL siêu nhẹ để giữ kết nối Database không bị ngủ đông
    await getPool().query('SELECT 1'); 
    res.status(200).send('Server and Database Money4Week are perfectly alive!');
  } catch (error) {
    res.status(500).send('Server is alive, but Database connection failed.');
  }
});

// Bắt lỗi 404 (Route không tồn tại)
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint không tồn tại' }});
});

// Bắt lỗi tập trung (Toàn hệ thống)
app.use(errorHandler);

module.exports = app;