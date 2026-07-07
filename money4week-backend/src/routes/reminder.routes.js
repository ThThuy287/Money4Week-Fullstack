const express = require('express');
const reminderController = require('../controllers/reminder.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Bắt buộc đăng nhập mới được xài
router.use(authMiddleware);

router.get('/', reminderController.getReminders);
router.post('/', reminderController.createReminder);
router.delete('/:id', reminderController.deleteReminder);
router.post('/:id/deposit', reminderController.deposit);

module.exports = router;