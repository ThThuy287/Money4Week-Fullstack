const widgetService = require('../services/widget.service');
const ApiError = require('../utils/apiError');

class WidgetController {
  // --- Phân luồng Reminders ---
  async getReminders(req, res, next) {
    try {
      const reminders = await widgetService.getReminders(req.user.id, req.query.isPaid);
      res.status(200).json(reminders);
    } catch (error) {
      next(error);
    }
  }

  // --- Phân luồng Notes ---
  async getNotes(req, res, next) {
    try {
      const notes = await widgetService.getNotes(req.user.id);
      res.status(200).json(notes);
    } catch (error) {
      next(error);
    }
  }

  async createNote(req, res, next) {
    try {
      if (!req.body.content) throw new ApiError(400, 'VALIDATION_ERROR', 'Nội dung ghi chú không được để trống');
      const note = await widgetService.createNote(req.user.id, req.body.content);
      res.status(201).json(note); // Trả về luôn note vừa tạo để Frontend hiển thị ngay
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req, res, next) {
    try {
      if (!req.body.content) throw new ApiError(400, 'VALIDATION_ERROR', 'Nội dung ghi chú không được để trống');
      await widgetService.updateNote(req.user.id, req.params.id, req.body.content);
      res.status(200).json({ message: 'Cập nhật ghi chú thành công' });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req, res, next) {
    try {
      await widgetService.deleteNote(req.user.id, req.params.id);
      res.status(204).send(); // 204 No Content
    } catch (error) {
      next(error);
    }
  }

  async toggleNote(req, res, next) {
    try {
      await widgetService.toggleNote(req.user.id, req.params.id);
      res.status(200).json({ message: 'Đổi trạng thái ghi chú thành công' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WidgetController();