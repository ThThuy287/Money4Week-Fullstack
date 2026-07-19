const { getPool } = require('../config/db');
const ApiError = require('../utils/apiError');

class TransactionService {
  async getTransactions(userId, queryParams) {
    const { page = 1, limit = 1000, type, startDate, endDate, categoryId } = queryParams;
    const pool = getPool();
    const offset = (page - 1) * limit;

    let baseQuery = `FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = $1 AND t.deleted_at IS NULL`;
    const values = [userId];
    let paramIndex = 2;

    if (type) { baseQuery += ` AND t.type = $${paramIndex++}`; values.push(type); }
    if (startDate) { baseQuery += ` AND t.transaction_date >= $${paramIndex++}`; values.push(startDate); }
    if (endDate) { baseQuery += ` AND t.transaction_date <= $${paramIndex++}`; values.push(endDate); }
    if (categoryId) { baseQuery += ` AND t.category_id = $${paramIndex++}`; values.push(categoryId); }

    const countResult = await pool.query(`SELECT COUNT(*) as total ${baseQuery}`, values);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT t.id, t.type, t.amount, t.transaction_date as date, t.note,
             c.id as category_id, c.name as category_name, c.icon as category_icon, 
             c.color_hex as category_color, c.limit_amount as category_limit
      ${baseQuery}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, [...values, parseInt(limit), parseInt(offset)]);

    const formattedData = dataResult.rows.map(row => ({
      id: row.id, type: row.type, amount: row.amount,
      date: new Date(row.date).toISOString().split('T')[0],
      note: row.note,
      category: {
        id: row.category_id, name: row.category_name, icon: row.category_icon,
        color: row.category_color, limit: row.category_limit
      }
    }));

    return { data: formattedData, meta: { total, page: parseInt(page), lastPage: Math.ceil(total / limit) } };
  }

  async createTransaction(userId, data) {
    const pool = getPool();
    await pool.query(`
      INSERT INTO transactions (user_id, category_id, type, amount, transaction_date, note)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, data.category_id, data.type, data.amount, data.transaction_date, data.note || '']);
  }

  async deleteTransaction(userId, transactionId) {
    const pool = getPool();
    const result = await pool.query(`UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [transactionId, userId]);
    if (result.rowCount === 0) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy giao dịch hoặc đã bị xóa');
  }

  async resetTransactions(userId) {
    await getPool().query(`DELETE FROM transactions WHERE user_id = $1`, [userId]); 
  }
  async updateTransaction(userId, transactionId, data) {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE transactions 
      SET category_id = $1, type = $2, amount = $3, transaction_date = $4, note = $5
      WHERE id = $6 AND user_id = $7 AND deleted_at IS NULL
    `, [data.category_id, data.type, data.amount, data.transaction_date, data.note || '', transactionId, userId]);
    
    if (result.rowCount === 0) {
      throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy giao dịch hoặc đã bị xóa');
    }
  }
}
module.exports = new TransactionService();