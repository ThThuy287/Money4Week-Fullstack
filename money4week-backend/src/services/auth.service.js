const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getPool } = require('../config/db');
const ApiError = require('../utils/apiError');

class AuthService {
  hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex'); }

  async register(fullName, email, password) {
    const pool = getPool();
    const client = await pool.connect(); // Dùng client riêng cho Transaction
    try {
      await client.query('BEGIN');
      
      const checkEmail = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (checkEmail.rows.length > 0) throw new ApiError(409, 'VALIDATION_ERROR', 'Email này đã được đăng ký', 'email');

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      const insertUserQuery = `
        INSERT INTO users (full_name, email, password_hash, is_active, is_email_verified) 
        VALUES ($1, $2, $3, TRUE, TRUE) RETURNING id
      `;
      const userResult = await client.query(insertUserQuery, [fullName, email, passwordHash]);
      const userId = userResult.rows[0].id;

      const insertSettingsQuery = `
        INSERT INTO user_settings (user_id, cycle_type, cycle_anchor_date, theme, language)
        VALUES ($1, '4_weeks', CURRENT_DATE, 'light', 'vi')
      `;
      await client.query(insertSettingsQuery, [userId]);

      await client.query('COMMIT');
      return this.generateTokens(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release(); // Trả kết nối về pool
    }
  }

  async login(email, password) {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Email này chưa được đăng ký!');
    if (user.is_active !== true) throw new ApiError(401, 'UNAUTHORIZED', 'Tài khoản chưa kích hoạt!');

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) throw new ApiError(401, 'UNAUTHORIZED', 'Mật khẩu không chính xác!');

    return this.generateTokens(user.id);
  }

  async refreshToken(rawRefreshToken) {
    if (!rawRefreshToken) throw new ApiError(401, 'UNAUTHORIZED', 'Refresh Token bị thiếu');
    try {
      const decoded = jwt.verify(rawRefreshToken, process.env.JWT_SECRET);
      const hashedToken = this.hashToken(rawRefreshToken);
      const pool = getPool();
      
      const result = await pool.query(`
        SELECT user_id FROM refresh_tokens 
        WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      `, [hashedToken]);
      
      if (result.rows.length === 0) throw new ApiError(401, 'UNAUTHORIZED', 'Token không hợp lệ hoặc đã bị đăng xuất');

      const userId = result.rows[0].user_id;
      await pool.query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1', [hashedToken]);
      return this.generateTokens(userId);
    } catch (error) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Refresh Token hết hạn hoặc không hợp lệ');
    }
  }

  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const hashedToken = this.hashToken(rawRefreshToken);
    await getPool().query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1', [hashedToken]);
  }

  async generateTokens(userId) {
    const jti = crypto.randomBytes(16).toString('hex'); 
    const accessToken = jwt.sign({ id: userId, jti }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ id: userId, jti }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
    const hashedRefreshToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

    const pool = getPool();
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    await pool.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [userId, hashedRefreshToken, expiresAt]);

    return { accessToken, refreshToken };
  }

  async forgotPassword(email) {
    const pool = getPool();
    const result = await pool.query('SELECT id, full_name FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    if (result.rows.length === 0) return { message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(`UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3`, [resetToken, resetTokenExpiry, email]);
    return { message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu' };
  }

  async resetPasswordDirect(email, newPassword) {
    const pool = getPool(); 
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản với email này.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
    return true;
  }
}
module.exports = new AuthService();