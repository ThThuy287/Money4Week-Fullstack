const { getPool } = require('../config/db');

class ReminderService {
  async syncTableSchema(pool) {
    await pool.query(`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS current_amount DECIMAL(15,2) DEFAULT 0;`);
  }

  // Hàm dùng chung để tự động dời ngày và reset số dư
  async advanceOverdueReminders(pool, userId) {
    // Lặp tối đa 12 lần để xử lý nếu bạn không vào app trong nhiều tháng liền
    for (let i = 0; i < 12; i++) {
      const res = await pool.query(`
        UPDATE reminders 
        SET current_amount = 0, 
            is_paid = FALSE,
            due_date = due_date + INTERVAL '1 month'
        WHERE user_id = $1 
          AND due_date < CURRENT_DATE
      `, [userId]);
      
      // Nếu không còn mục tiêu nào bị quá hạn thì dừng vòng lặp
      if (res.rowCount === 0) break; 
    }
  }

  async getReminders(userId) {
    const pool = getPool();
    try {
      await this.syncTableSchema(pool); 
      
      // 1. Kiểm tra và tự động dời chu kỳ + reset tiền cho các mục tiêu đã qua hạn chót
      await this.advanceOverdueReminders(pool, userId);

      // 2. Lấy dữ liệu mới nhất (đã được làm sạch) trả về cho Frontend
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
    
    // Đảm bảo cập nhật chu kỳ trước (phòng hờ bạn nạp tiền ngay lúc vừa chuyển giao ngày mới)
    await this.advanceOverdueReminders(pool, userId);

    // Tiến hành cộng tiền nạp vào chu kỳ hiện tại
    await pool.query(`
      UPDATE reminders 
      SET current_amount = COALESCE(current_amount, 0) + $1,
          is_paid = CASE WHEN (COALESCE(current_amount, 0) + $1) >= COALESCE(amount, 0) THEN TRUE ELSE FALSE END
      WHERE id = $2 AND user_id = $3
    `, [data.amount, reminderId, userId]);
  }
}
module.exports = new ReminderService();