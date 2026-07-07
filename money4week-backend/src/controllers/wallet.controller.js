const walletService = require('../services/wallet.service');

class WalletController {
  async getWallets(req, res, next) {
    try {
      const wallets = await walletService.getWallets(req.user.id);
      res.json(wallets);
    } catch (error) { next(error); }
  }
  async createWallet(req, res, next) {
    try {
      await walletService.createWallet(req.user.id, req.body);
      res.status(201).json({ message: 'Tạo ví thành công' });
    } catch (error) { next(error); }
  }
  async updateWallet(req, res, next) {
    try {
      await walletService.updateWallet(req.user.id, req.params.id, req.body);
      res.json({ message: 'Cập nhật ví thành công' });
    } catch (error) { next(error); }
  }
  async deleteWallet(req, res, next) {
    try {
      await walletService.deleteWallet(req.user.id, req.params.id);
      res.json({ message: 'Đã xóa ví' });
    } catch (error) { next(error); }
  }
  async deposit(req, res, next) {
    try {
      await walletService.deposit(req.user.id, req.params.id, req.body);
      res.json({ message: 'Nạp tiền thành công' });
    } catch (error) { next(error); }
  }
  async getHistory(req, res, next) {
    try {
      const history = await walletService.getHistory(req.user.id);
      res.json(history);
    } catch (error) { next(error); }
  }
}
module.exports = new WalletController();