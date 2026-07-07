const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Bắt buộc mang vòng tay (accessToken)
router.use(authMiddleware);

// 1. Dashboard (Trang chủ)
router.get('/dashboard', analyticsController.getDashboard);

// 2. Reports (Trang báo cáo)
router.get('/reports', analyticsController.getReports);
router.post('/notes', analyticsController.addNote);
router.put('/notes/:id', analyticsController.toggleNote);
router.delete('/notes/:id', analyticsController.deleteNote);

module.exports = router;