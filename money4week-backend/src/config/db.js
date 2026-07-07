const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình kết nối PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Neon cung cấp 1 chuỗi URL duy nhất cực kỳ tiện lợi
  ssl: {
    rejectUnauthorized: false // Bắt buộc khi kết nối tới Cloud Database như Neon
  },
  max: 10, // Số lượng connection tối đa trong pool
  idleTimeoutMillis: 30000
});

// Hàm kiểm tra kết nối khi khởi động server
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Đã kết nối thành công tới PostgreSQL (Neon)!');
    client.release(); // Test xong thì trả connection lại cho pool
  } catch (err) {
    console.error('❌ Lỗi kết nối Database:', err.message);
  }
};

// Gọi hàm test kết nối
connectDB();

module.exports = {
  pool,
  getPool: () => pool // Giữ nguyên hàm getPool() để các file Service cũ không bị lỗi "undefined function"
};