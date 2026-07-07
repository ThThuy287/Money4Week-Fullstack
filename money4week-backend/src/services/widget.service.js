const { getPool } = require('../config/db');
const ApiError = require('../utils/apiError');

class WidgetService {
  async getReminders(userId, isPaid) {
    let query = `SELECT r.id, r.title, r.amount, r.due_date, r.is_paid, c.name as category_name, c.icon as category_icon FROM reminders r LEFT JOIN categories c ON r.category_id = c.id WHERE r.user_id = $1`;
    const values = [userId];
    if (isPaid !== undefined) {
      query += ` AND r.is_paid = $2`;
      values.push(isPaid === 'true' || isPaid === '1' ? true : false);
    }
    query += ` ORDER BY r.due_date ASC`;
    const result = await getPool().query(query, values);
    return result.rows;
  }

  async getNotes(userId) {
    const result = await getPool().query(`SELECT * FROM notes WHERE user_id = $1 ORDER BY position ASC, created_at DESC`, [userId]);
    return result.rows;
  }

  async createNote(userId, content) {
    const result = await getPool().query(`INSERT INTO notes (user_id, content) VALUES ($1, $2) RETURNING *`, [userId, content]);
    return result.rows[0];
  }

  async updateNote(userId, noteId, content) {
    const result = await getPool().query(`UPDATE notes SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`, [content, noteId, userId]);
    if (result.rowCount === 0) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy ghi chú');
  }

  async deleteNote(userId, noteId) {
    const result = await getPool().query(`DELETE FROM notes WHERE id = $1 AND user_id = $2`, [noteId, userId]);
    if (result.rowCount === 0) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy ghi chú');
  }

  async toggleNote(userId, noteId) {
    const result = await getPool().query(`UPDATE notes SET is_completed = NOT is_completed, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`, [noteId, userId]);
    if (result.rowCount === 0) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy ghi chú');
  }
}
module.exports = new WidgetService();