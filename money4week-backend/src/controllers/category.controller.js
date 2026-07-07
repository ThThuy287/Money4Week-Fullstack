const categoryService = require('../services/category.service');

class CategoryController {
  async getCategories(req, res, next) {
    try {
      const { type } = req.query;
      const categories = await categoryService.getCategories(req.user.id, type);
      res.status(200).json(categories);
    } catch (error) { next(error); }
  }

  // BỔ SUNG CÁC HÀM XỬ LÝ
  async createCategory(req, res, next) {
    try {
      await categoryService.createCategory(req.user.id, req.body);
      res.status(201).json({ message: 'Tạo danh mục thành công' });
    } catch (error) { next(error); }
  }

  async updateCategory(req, res, next) {
    try {
      await categoryService.updateCategory(req.user.id, req.params.id, req.body);
      res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) { next(error); }
  }

  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.user.id, req.params.id);
      res.status(200).json({ message: 'Đã xóa danh mục' });
    } catch (error) { next(error); }
  }
}

module.exports = new CategoryController();