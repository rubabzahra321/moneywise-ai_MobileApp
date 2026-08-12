const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  parseExpense,
  autoCategorize,
  generateInsights,
  getSavingsTips,
  scanReceipt,
  getAISuggestions, // ✅ Add this
} = require('../controllers/aiController');

// All routes require authentication
router.use(auth);

// AI endpoints
router.post('/parse-expense', parseExpense);
router.post('/categorize', autoCategorize);
router.get('/insights', generateInsights);
router.get('/ai-suggestions', getAISuggestions); // ✅ Add this for legacy support
router.get('/savings-tips', getSavingsTips);
router.post('/scan-receipt', scanReceipt);

module.exports = router;