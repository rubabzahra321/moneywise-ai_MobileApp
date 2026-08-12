const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

// Get all notifications for user
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    const result = await notificationService.getUserNotifications(
      req.user._id,
      { limit: parseInt(limit), offset: parseInt(offset), unreadOnly: unreadOnly === 'true' }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.user._id,
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await notificationService.deleteNotification(
      req.user._id,
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

// Delete all read notifications
exports.deleteAllRead = async (req, res) => {
  try {
    const count = await notificationService.deleteAllRead(req.user._id);

    res.json({
      success: true,
      message: `${count} notifications deleted`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications',
    });
  }
};

// Create notification (for testing or manual triggers)
exports.createNotification = async (req, res) => {
  try {
    const notification = await notificationService.createNotification({
      userId: req.user._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
    });
  }
};