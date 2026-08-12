const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  autoCategorize,
} = require('../controllers/categoryController');

router.get('/', auth, getCategories);
router.post('/', auth, createCategory);
router.put('/:id', auth, updateCategory);
router.delete('/:id', auth, deleteCategory);
router.post('/auto-categorize', auth, autoCategorize);

module.exports = router;