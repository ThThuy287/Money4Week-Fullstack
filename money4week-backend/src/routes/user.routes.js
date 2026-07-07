const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Phải đi qua middleware kiểm tra đăng nhập
router.use(authMiddleware);

// Định nghĩa chính xác 2 đường dẫn mà Frontend đang gọi
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

module.exports = router;