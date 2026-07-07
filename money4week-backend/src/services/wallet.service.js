const { getPool } = require('../config/db');

class WalletService {
  async getWallets(userId) {
    const pool = getPool();
    const result = await pool.query(`
      SELECT id, name, target_amount, current_amount, deadline_date as deadline, 
             is_completed, color, icon, is_auto as isAuto, auto_frequency as autoFrequency, auto_amount as autoAmount
      FROM wallets WHERE user_id = $1 AND is_archived = FALSE ORDER BY deadline_date ASC
    `, [userId]);
    return result.rows;
  }

  async createWallet(userId, data) {
    await getPool().query(`
      INSERT INTO wallets (user_id, name, target_amount, current_amount, deadline_date, is_completed, is_archived, color, icon, is_auto, auto_frequency, auto_amount)
      VALUES ($1, $2, $3, 0, $4, FALSE, FALSE, $5, $6, $7, $8, $9)
    `, [userId, data.name, data.amount, data.deadline || null, data.color || '#094CB2', data.icon || 'Wallet', data.isAuto ? true : false, data.autoFrequency, data.autoAmount || 0]);
  }

  async updateWallet(userId, walletId, data) {
    await getPool().query(`
      UPDATE wallets SET name = $1, target_amount = $2, deadline_date = $3, color = $4, icon = $5, is_auto = $6, auto_frequency = $7, auto_amount = $8
      WHERE id = $9 AND user_id = $10
    `, [data.name, data.amount, data.deadline || null, data.color, data.icon || 'Wallet', data.isAuto ? true : false, data.autoFrequency, data.autoAmount || 0, walletId, userId]);
  }

  async deleteWallet(userId, walletId) {
    await getPool().query(`UPDATE wallets SET is_archived = TRUE WHERE id = $1 AND user_id = $2`, [walletId, userId]);
  }

  async deposit(userId, walletId, data) {
    const pool = getPool();
    await pool.query(`
      UPDATE wallets 
      SET current_amount = COALESCE(current_amount, 0) + $1,
          is_completed = CASE WHEN (COALESCE(current_amount, 0) + $1) >= COALESCE(target_amount, 0) THEN TRUE ELSE FALSE END
      WHERE id = $2 AND user_id = $3
    `, [data.amount, walletId, userId]);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, wallet_id UUID,
        amount DECIMAL(15,2), transaction_date DATE, note VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`INSERT INTO wallet_history (user_id, wallet_id, amount, transaction_date, note) VALUES ($1, $2, $3, $4, $5)`, [userId, walletId, data.amount, data.date || new Date(), data.note || 'Nạp tiền vào ví']);
  }

  async getHistory(userId) {
    try {
      const result = await getPool().query(`
        SELECT h.id, h.transaction_date as date, h.note as "desc", w.name as walletName, w.icon, w.color, h.amount, w.id as walletId
        FROM wallet_history h JOIN wallets w ON h.wallet_id = w.id
        WHERE h.user_id = $1 ORDER BY h.transaction_date DESC, h.created_at DESC
      `, [userId]);
      return result.rows.map(r => {
         const d = new Date(r.date);
         return { id: r.id, walletId: r.walletId, date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`, desc: r.desc, walletName: r.walletName, icon: r.icon, color: r.color, amount: r.amount.toLocaleString('vi-VN') + ' VNĐ' };
      });
    } catch (error) { return []; }
  }
}
module.exports = new WalletService();