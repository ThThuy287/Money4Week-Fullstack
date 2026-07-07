const reminderService = require('../services/reminder.service');

class ReminderController {
  async getReminders(req, res, next) {
    try {
      const reminders = await reminderService.getReminders(req.user.id);
      res.json(reminders);
    } catch (error) { next(error); }
  }

  async createReminder(req, res, next) {
    try {
      await reminderService.createReminder(req.user.id, req.body);
      res.status(201).json({ message: 'Tạo mục tiêu thành công!' });
    } catch (error) { next(error); }
  }

  async deleteReminder(req, res, next) {
    try {
      await reminderService.deleteReminder(req.user.id, req.params.id);
      res.json({ message: 'Đã xóa mục tiêu!' });
    } catch (error) { next(error); }
  }
  async deleteReminder(req, res, next) {
    try {
      await reminderService.deleteReminder(req.user.id, req.params.id);
      res.json({ message: 'Đã xóa mục tiêu!' });
    } catch (error) { next(error); }
  }

  // THÊM KHỐI NÀY VÀO CUỐI CLASS (Trước dấu } đóng class)
  async deposit(req, res, next) {
    try {
      await reminderService.deposit(req.user.id, req.params.id, req.body);
      res.json({ message: 'Nạp tiền vào mục tiêu thành công!' });
    } catch (error) { next(error); }
  }
}

module.exports = new ReminderController();