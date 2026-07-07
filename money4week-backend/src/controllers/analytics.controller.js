const analyticsService = require('../services/analytics.service');

class AnalyticsController {
  async getDashboard(req, res, next) {
    try {
      // req.user.id được lấy từ token bảo mật
      const dashboardData = await analyticsService.getDashboard(req.user.id);
      res.status(200).json(dashboardData);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const reportData = await analyticsService.getReports(req.user.id, req.query);
      res.status(200).json(reportData);
    } catch (error) {
      next(error);
    }
  }
  async addNote(req, res, next) {
    try {
      const note = await analyticsService.addNote(req.user.id, req.body.text);
      res.status(201).json(note);
    } catch (error) { next(error); }
  }

  async toggleNote(req, res, next) {
    try {
      await analyticsService.toggleNote(req.user.id, req.params.id);
      res.status(200).json({ message: 'OK' });
    } catch (error) { next(error); }
  }

  async deleteNote(req, res, next) {
    try {
      await analyticsService.deleteNote(req.user.id, req.params.id);
      res.status(200).json({ message: 'OK' });
    } catch (error) { next(error); }
  }
}

module.exports = new AnalyticsController();