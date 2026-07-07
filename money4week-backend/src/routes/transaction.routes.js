const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Bắt buộc xác thực với mọi thao tác của Giao dịch
router.use(authMiddleware);

// 1. Lấy lịch sử giao dịch (có phân trang và lọc)
router.get('/', transactionController.getTransactions);

// 2. Thêm giao dịch mới
router.post('/', transactionController.createTransaction);
// Thêm dòng này vào khu vực chứa các router:
router.delete('/reset', transactionController.resetTransactions);

// 3. Xóa mềm giao dịch
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;