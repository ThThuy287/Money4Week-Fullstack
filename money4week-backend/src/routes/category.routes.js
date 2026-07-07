const express = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// Các đường truyền API
router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory); // Hàm Thêm
router.put('/:id', categoryController.updateCategory); // Hàm Sửa
router.delete('/:id', categoryController.deleteCategory); // Hàm Xóa

module.exports = router;