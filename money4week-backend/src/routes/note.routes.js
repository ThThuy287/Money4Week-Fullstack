const express = require('express');
const widgetController = require('../controllers/widget.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

// Các API cho /api/notes
router.get('/', widgetController.getNotes);
router.post('/', widgetController.createNote);
router.put('/:id', widgetController.updateNote);
router.delete('/:id', widgetController.deleteNote);
router.patch('/:id/toggle', widgetController.toggleNote);

module.exports = router;