const express = require('express');
const walletController = require('../controllers/wallet.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/history', walletController.getHistory); // Đặt trên cùng để tránh bị nhầm thành ID
router.get('/', walletController.getWallets);
router.post('/', walletController.createWallet);
router.put('/:id', walletController.updateWallet);
router.delete('/:id', walletController.deleteWallet);
router.post('/:id/deposit', walletController.deposit); // Nhận lệnh Nạp Tiền

module.exports = router;