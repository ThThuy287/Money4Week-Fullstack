const { getPool } = require('../config/db');
const ApiError = require('../utils/apiError');

class UserService {
  async getProfile(userId) {
    const result = await getPool().query(`
      SELECT u.id, u.email, u.full_name, u.job_title, u.avatar_url, u.created_at, s.cycle_type, s.cycle_anchor_date, s.theme, s.language
      FROM users u LEFT JOIN user_settings s ON u.id = s.user_id WHERE u.id = $1
    `, [userId]);
    if (result.rows.length === 0) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy thông tin người dùng');
    return result.rows[0];
  }

  async updateProfile(userId, { full_name, job_title }) {
    await getPool().query(`
      UPDATE users SET full_name = COALESCE($1, full_name), job_title = COALESCE($2, job_title), updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [full_name !== undefined ? full_name : null, job_title !== undefined ? job_title : null, userId]);
  }

  async updateSettings(userId, { cycle_type, cycle_anchor_date, theme, language }) {
    await getPool().query(`
      UPDATE user_settings SET cycle_type = COALESCE($1, cycle_type), cycle_anchor_date = COALESCE($2, cycle_anchor_date), theme = COALESCE($3, theme), language = COALESCE($4, language), updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $5
    `, [cycle_type !== undefined ? cycle_type : null, cycle_anchor_date !== undefined ? cycle_anchor_date : null, theme !== undefined ? theme : null, language !== undefined ? language : null, userId]);
  }
}
module.exports = new UserService();