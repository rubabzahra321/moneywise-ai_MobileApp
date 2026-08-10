const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createSubscription,
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
} = require('../controllers/subscriptionController');

router.post('/', auth, createSubscription);
router.get('/', auth, getSubscriptions);
router.put('/:id', auth, updateSubscription);
router.delete('/:id', auth, deleteSubscription);

module.exports = router;