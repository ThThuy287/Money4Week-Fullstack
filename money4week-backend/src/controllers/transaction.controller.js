const transactionService = require('../services/transaction.service');
const ApiError = require('../utils/apiError');

class TransactionController {
  async getTransactions(req, res, next) {
    try {
      const result = await transactionService.getTransactions(req.user.id, req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req, res, next) {
    try {
      const { category_id, type, amount, transaction_date } = req.body;
      
      // Kiểm tra dữ liệu bắt buộc
      if (!category_id || !type || amount === undefined || !transaction_date) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Vui lòng điền đủ thông tin bắt buộc');
      }
      
      // Chặn giao dịch có số tiền âm
      if (amount <= 0) {
        throw new ApiError(422, 'UNPROCESSABLE_ENTITY', 'Số tiền giao dịch phải lớn hơn 0');
      }

      await transactionService.createTransaction(req.user.id, req.body);
      res.status(201).json({ message: 'Tạo giao dịch thành công' });
    } catch (error) {
      next(error);
    }
  }

  async deleteTransaction(req, res, next) {
    try {
      await transactionService.deleteTransaction(req.user.id, req.params.id);
      res.status(204).send(); // Gửi status 204 thì body tự động bị bỏ qua (No Content)
    } catch (error) {
      next(error);
    }
  }
  // Thêm vào trong class TransactionController
  async resetTransactions(req, res, next) {
    try {
      await transactionService.resetTransactions(req.user.id);
      res.status(200).json({ message: 'Đã dọn dẹp toàn bộ giao dịch.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransactionController();