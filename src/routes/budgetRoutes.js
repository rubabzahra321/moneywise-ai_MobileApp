const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
} = require('../controllers/budgetController');

router.post('/', auth, createBudget);
router.get('/', auth, getBudgets);
router.get('/status', auth, getBudgetStatus);
router.put('/:id', auth, updateBudget);
router.delete('/:id', auth, deleteBudget);

module.exports = router;