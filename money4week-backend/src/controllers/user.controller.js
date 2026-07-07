const userService = require('../services/user.service');

class UserController {
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user.id);
      res.json(profile);
    } catch (error) { next(error); }
  }

  async updateProfile(req, res, next) {
    try {
      await userService.updateProfile(req.user.id, req.body);
      res.json({ message: 'Cập nhật hồ sơ thành công' });
    } catch (error) { next(error); }
  }
}

module.exports = new UserController();