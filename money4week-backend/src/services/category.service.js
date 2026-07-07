const { getPool } = require('../config/db');

class CategoryService {
  async getCategories(userId, type) {
    let query = `SELECT id, name, type, icon, color_hex, note, limit_amount FROM categories WHERE user_id = $1 AND is_active = TRUE`;
    const values = [userId];
    if (type) { query += ` AND type = $2`; values.push(type); }
    query += ` ORDER BY name ASC`;
    const result = await getPool().query(query, values);
    return result.rows;
  }

  async createCategory(userId, data) {
    await getPool().query(`
      INSERT INTO categories (user_id, name, type, icon, color_hex, note, limit_amount, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    `, [userId, data.name, data.type || 'expense', data.icon, data.color_hex, data.note || '', data.limit_amount || 0]);
  }

  async updateCategory(userId, categoryId, data) {
    await getPool().query(`
      UPDATE categories SET name = $1, type = $2, icon = $3, color_hex = $4, note = $5, limit_amount = $6
      WHERE id = $7 AND user_id = $8
    `, [data.name, data.type, data.icon, data.color_hex, data.note || '', data.limit_amount || 0, categoryId, userId]);
  }

  async deleteCategory(userId, categoryId) {
    await getPool().query(`UPDATE categories SET is_active = FALSE WHERE id = $1 AND user_id = $2`, [categoryId, userId]);
  }
}
module.exports = new CategoryService();