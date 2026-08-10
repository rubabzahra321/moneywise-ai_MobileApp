const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification,
} = require('../controllers/notificationController');

router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/read-all', deleteAllRead);
router.post('/', createNotification);

module.exports = router;