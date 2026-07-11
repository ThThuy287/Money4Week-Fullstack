const { getPool } = require('../config/db');

class AnalyticsService {
  async _getCycleDates(userId, pool) {
    const settings = await pool.query(`SELECT cycle_type, cycle_anchor_date FROM user_settings WHERE user_id = $1`, [userId]);
    if (settings.rows.length === 0) return { start: new Date(), end: new Date() };
    const { cycle_type, cycle_anchor_date } = settings.rows[0];
    const anchor = new Date(cycle_anchor_date);
    const today = new Date();
    let start = new Date(anchor), end = new Date(anchor);

    if (cycle_type === '4_weeks') {
      const daysDiff = Math.floor((today - anchor) / (24 * 60 * 60 * 1000));
      const cyclesPassed = Math.floor(daysDiff / 28);
      start.setDate(anchor.getDate() + (cyclesPassed * 28));
      end.setDate(start.getDate() + 27);
    } else if (cycle_type === '1_month' || cycle_type === '30_days') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    return { start, end };
  }

  async getDashboard(userId) {
    const pool = getPool();
    const cycle = await this._getCycleDates(userId, pool);
    const sqlStart = cycle.start.toISOString().split('T')[0];
    const sqlEnd = cycle.end.toISOString().split('T')[0];

    const transResult = await pool.query(`
      SELECT type, amount, transaction_date as date
      FROM transactions WHERE user_id = $1 AND deleted_at IS NULL AND transaction_date >= $2 AND transaction_date <= $3
    `, [userId, sqlStart, sqlEnd]);
    const transactions = transResult.rows;

    let totalIncome = 0, totalExpense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += Number(t.amount);
      if (t.type === 'expense') totalExpense += Number(t.amount);
    });

    // 2. Tính TỔNG SỐ DƯ HIỆN TẠI (Tính trọn đời, KHÔNG bị giới hạn bởi sqlStart và sqlEnd)
    // Tổng Thu - Tổng Chi (Trọn đời)
    const lifetimeTransResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_in,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_out
      FROM transactions WHERE user_id = $1 AND deleted_at IS NULL
    `, [userId]);
    const lifetimeIncome = Number(lifetimeTransResult.rows[0].total_in) || 0;
    const lifetimeExpense = Number(lifetimeTransResult.rows[0].total_out) || 0;

    // Tổng Tiền nạp vào Ví tiết kiệm (Trọn đời, LỌC BỎ CÁC VÍ ĐÃ XÓA)
    const lifetimeWalletResult = await pool.query(`
      SELECT SUM(wt.amount) as total_deposit
      FROM wallet_transactions wt 
      JOIN wallets w ON wt.wallet_id = w.id
      WHERE w.user_id = $1 AND wt.type = 'deposit' AND w.is_archived = FALSE
    `, [userId]);
    const lifetimeDeposit = Number(lifetimeWalletResult.rows[0].total_deposit) || 0;

    // Áp dụng công thức: Thu - Chi - Nạp Ví
    const currentBalance = lifetimeIncome - lifetimeExpense - lifetimeDeposit;
    const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;

    const walletsResult = await pool.query(`SELECT name, target_amount, current_amount, deadline_date FROM wallets WHERE user_id = $1 AND is_completed = FALSE AND is_archived = FALSE ORDER BY deadline_date ASC`, [userId]);
    
    let neededToSaveThisWeek = 0;
    let smartAlert = null; 
    const today = new Date();

    walletsResult.rows.forEach(w => {
      const remaining = w.target_amount - w.current_amount;
      const daysLeft = Math.ceil((new Date(w.deadline_date) - today) / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.ceil(daysLeft / 7);
      if (remaining > 0 && weeksLeft > 0) neededToSaveThisWeek += (remaining / weeksLeft);
      if (remaining > 0 && daysLeft <= 7 && daysLeft >= 0 && !smartAlert) {
        smartAlert = { title: w.name, days_left: daysLeft, amount_needed: remaining };
      }
    });

    const weekly_chart = [{ week: "Tuần 1", income: 0, expense: 0 }, { week: "Tuần 2", income: 0, expense: 0 }, { week: "Tuần 3", income: 0, expense: 0 }, { week: "Tuần 4", income: 0, expense: 0 }];
    transactions.forEach(t => {
      const daysFromStart = Math.floor((new Date(t.date) - cycle.start) / (1000 * 60 * 60 * 24));
      let weekIndex = Math.floor(daysFromStart / 7);
      if (weekIndex > 3) weekIndex = 3; 
      if (weekIndex >= 0) {
        if (t.type === 'income') weekly_chart[weekIndex].income += Number(t.amount);
        if (t.type === 'expense') weekly_chart[weekIndex].expense += Number(t.amount);
      }
    });

    const topExpenseResult = await pool.query(`
      SELECT c.name as category_name, SUM(t.amount) as total_amount
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.type = 'expense' AND t.deleted_at IS NULL AND t.transaction_date >= $2 AND t.transaction_date <= $3
      GROUP BY c.name ORDER BY total_amount DESC LIMIT 1
    `, [userId, sqlStart, sqlEnd]);
    
    let highestExpense = null;
    if (topExpenseResult.rows.length > 0) {
      const top = topExpenseResult.rows[0];
      highestExpense = { name: top.category_name, ratio: totalExpense > 0 ? Math.round((top.total_amount / totalExpense) * 100) : 0 };
    }

    const remindersResult = await pool.query(`SELECT title, amount, due_date FROM reminders WHERE user_id = $1 AND is_paid = FALSE ORDER BY due_date ASC`, [userId]);
    const calendar_events = [];
    remindersResult.rows.forEach(r => {
      if(r.due_date) {
        const dateStr = new Date(r.due_date).toISOString().split('T')[0];
        if (!calendar_events.includes(dateStr)) calendar_events.push(dateStr);
      }
    });

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const upcoming_reminders = remindersResult.rows.filter(r => new Date(r.due_date) >= todayStart).slice(0, 3);

    const notesResult = await pool.query(`SELECT id, content as text, is_completed as completed FROM notes WHERE user_id = $1 ORDER BY created_at ASC`, [userId]);
    const user_notes = notesResult.rows;

    return { cycle: { start: sqlStart, end: sqlEnd }, overview: { total_income: totalIncome, total_expense: totalExpense, current_balance: currentBalance, needed_to_save_this_week: Math.round(neededToSaveThisWeek), saving_rate: parseFloat(savingRate), smart_alert: smartAlert, highest_expense: highestExpense }, weekly_chart, calendar_events, upcoming_reminders, user_notes };
  }

  async getReports(userId, queryParams) {
    const pool = getPool();
    const cycle = await this._getCycleDates(userId, pool);
    const sqlStart = cycle.start.toISOString().split('T')[0];
    const sqlEnd = cycle.end.toISOString().split('T')[0];

    const expenseQuery = await pool.query(`
      SELECT c.name as category_name, c.color_hex as color, SUM(t.amount) as amount
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.type = 'expense' AND t.deleted_at IS NULL AND t.transaction_date >= $2 AND t.transaction_date <= $3
      GROUP BY c.name, c.color_hex ORDER BY amount DESC
    `, [userId, sqlStart, sqlEnd]);
    
    let totalExpense = 0;
    expenseQuery.rows.forEach(r => totalExpense += Number(r.amount));

    const expense_by_category = expenseQuery.rows.map(row => ({
      category_name: row.category_name, amount: Number(row.amount),
      percentage: totalExpense > 0 ? parseFloat(((row.amount / totalExpense) * 100).toFixed(1)) : 0,
      color: row.color || '#3B82F6'
    }));

    const top_expenses = expense_by_category.slice(0, 5).map(item => ({ category: item.category_name, amount: item.amount, ratio: item.percentage, compare_with_prev_cycle: "+10%", trend: "up" }));
    return { saving_rate: 0, donut_chart: { expense_by_category }, top_expenses };
  }

  async addNote(userId, text) {
    const result = await getPool().query(`INSERT INTO notes (user_id, content, is_completed) VALUES ($1, $2, FALSE) RETURNING id, content as text, is_completed as completed`, [userId, text]);
    return result.rows[0];
  }

  async toggleNote(userId, noteId) {
    await getPool().query(`UPDATE notes SET is_completed = NOT is_completed WHERE id = $1 AND user_id = $2`, [noteId, userId]);
  }

  async deleteNote(userId, noteId) {
    await getPool().query(`DELETE FROM notes WHERE id = $1 AND user_id = $2`, [noteId, userId]);
  }
}
module.exports = new AnalyticsService();