const { getPool } = require('../config/db');

class ReminderService {
  async syncTableSchema(pool) {
    await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS current_amount DECIMAL(15,2) DEFAULT 0;`);
    // THÊM MỚI: Cột lưu ngày nạp tiền gần nhất để quản lý việc reset qua tháng
    await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS last_deposit_date DATE;`);
  }

  async getReminders(userId) {
    const pool = getPool();
    try {
      await this.syncTableSchema(pool); 
      
      // THÊM MỚI: Auto-reset số tiền tích lũy về 0 nếu tháng của lần nạp cuối khác với tháng hiện tại
      await pool.query(`
        UPDATE reminders 
        SET current_amount = 0, 
            is_paid = FALSE 
        WHERE user_id = $1 
          AND last_deposit_date IS NOT NULL 
          AND DATE_TRUNC('month', last_deposit_date) != DATE_TRUNC('month', CURRENT_DATE)
      `, [userId]);

      const result = await pool.query(`
        SELECT r.id, r.title as name, r.amount as target_amount, r.due_date as deadline, 
               COALESCE(r.current_amount, 0) as current_amount, r.is_paid as is_completed, c.icon as category_icon
        FROM reminders r LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.user_id = $1 ORDER BY r.due_date ASC
      `, [userId]);
      return result.rows;
    } catch (error) { return []; }
  }

  async createReminder(userId, data) {
    const pool = getPool();
    await this.syncTableSchema(pool);
    const safeCategoryId = (data.category_id && data.category_id.trim() !== '') ? data.category_id : null;
    const safeDeadline = (data.deadline && data.deadline.trim() !== '') ? data.deadline : null;

    await pool.query(`
      INSERT INTO reminders (user_id, title, amount, due_date, category_id, current_amount, is_paid)
      VALUES ($1, $2, $3, $4, $5, 0, FALSE)
    `, [userId, data.name, data.amount, safeDeadline, safeCategoryId]);
  }

  async deleteReminder(userId, reminderId) {
    await getPool().query(`DELETE FROM reminders WHERE id = $1 AND user_id = $2`, [reminderId, userId]);
  }

  async deposit(userId, reminderId, data) {
    const pool = getPool();
    // Lấy ngày nạp tiền từ Frontend gửi lên, nếu không có thì lấy ngày hiện tại
    const depositDate = data.date || new Date().toISOString();

    // 1. Kiểm tra và reset về 0 nếu lần nạp trước đó khác tháng với ngày nạp (depositDate) hiện tại
    await pool.query(`
      UPDATE reminders 
      SET current_amount = 0, is_paid = FALSE 
      WHERE id = $1 AND user_id = $2 
        AND last_deposit_date IS NOT NULL 
        AND DATE_TRUNC('month', last_deposit_date) != DATE_TRUNC('month', $3::DATE)
    `, [reminderId, userId, depositDate]);

    // 2. Tiến hành cộng dồn số tiền nạp mới và cập nhật lại last_deposit_date
    await pool.query(`
      UPDATE reminders 
      SET current_amount = COALESCE(current_amount, 0) + $1,
          last_deposit_date = $4::DATE,
          is_paid = CASE WHEN (COALESCE(current_amount, 0) + $1) >= COALESCE(amount, 0) THEN TRUE ELSE FALSE END
      WHERE id = $2 AND user_id = $3
    `, [data.amount, reminderId, userId, depositDate]);
  }
}
module.exports = new ReminderService();