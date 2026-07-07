const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau 1 phút.'
    }
  }
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// ✅ ĐÚNG - Đặt TRƯỚC module.exports
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/reset-password-direct', authController.resetPasswordDirect);
module.exports = router;