const Notification = require('../models/Notification');
const User = require('../models/User');
const socketService = require('../socket');

class NotificationService {
  /**
   * Create a notification for a user
   */
  async createNotification({
    userId,
    type,
    title,
    body,
    data = {},
    priority = 'medium',
    actionUrl = null,
    imageUrl = null,
    expiresAt = null,
  }) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        body,
        data,
        priority,
        actionUrl,
        imageUrl,
        expiresAt,
      });

      await notification.save();

      // Emit real-time notification via WebSocket
      this.emitNotification(userId, notification);

      // For high priority, also send push notification
      if (priority === 'high' || priority === 'urgent') {
        await this.sendPushNotification(userId, notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    try {
      const query = { userId };
      if (unreadOnly) {
        query.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit),
        Notification.countDocuments(query),
      ]);

      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false,
      });

      return {
        notifications,
        total,
        unreadCount,
        hasMore: offset + notifications.length < total,
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { notifications: [], total: 0, unreadCount: 0, hasMore: false };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      return result.modifiedCount;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId, notificationId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
      });
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return null;
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId) {
    try {
      const result = await Notification.deleteMany({
        userId,
        isRead: true,
      });
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      return 0;
    }
  }

  /**
   * Send push notification (Firebase Cloud Messaging)
   */
  async sendPushNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) {
        return;
      }

      // Implement FCM send logic here
      // This would require firebase-admin SDK
      console.log(`📱 Push notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Emit real-time notification via WebSocket.
   * ✅ This used to just console.log ("integrated with Socket.io later") —
   * now it actually pushes to the user's open WebSocket connection, if
   * they have one, via socket.js's sendToUser.
   */
  emitNotification(userId, notification) {
    const delivered = socketService.sendToUser(userId, notification);
    if (delivered) {
      console.log(`🔔 Real-time notification sent live to ${userId}: ${notification.title}`);
    } else {
      console.log(`🔕 User ${userId} not connected — notification saved for next load: ${notification.title}`);
    }
  }

  // ============================================
  // SPECIFIC NOTIFICATION HELPERS
  // ============================================

  /**
   * Notify when transaction is added
   */
  async notifyTransactionAdded(userId, transaction) {
    return this.createNotification({
      userId,
      type: 'transaction_added',
      title: 'Transaction Added',
      body: `${transaction.type === 'expense' ? 'Spent' : 'Received'} ${transaction.amount} ${transaction.currency} for ${transaction.description}`,
      data: { transactionId: transaction._id },
      priority: 'medium',
      actionUrl: `/transactions/${transaction._id}`,
    });
  }

  /**
   * Notify when budget is exceeded or near limit
   */
  async notifyBudgetStatus(userId, budget) {
    const status = budget.spent > budget.amount ? 'exceeded' : 'near_limit';
    const isExceeded = status === 'exceeded';

    return this.createNotification({
      userId,
      type: isExceeded ? 'budget_exceeded' : 'budget_near_limit',
      title: isExceeded ? 'Budget Exceeded!' : 'Budget Near Limit',
      body: isExceeded
        ? `You've exceeded your ${budget.categoryName} budget by ${budget.spent - budget.amount}`
        : `You've used ${budget.spent / budget.amount * 100}% of your ${budget.categoryName} budget`,
      data: { budgetId: budget._id },
      priority: isExceeded ? 'urgent' : 'high',
      actionUrl: `/budgets/${budget._id}`,
    });
  }

  /**
   * Notify when subscription is due
   */
  async notifySubscriptionDue(userId, subscription) {
    const daysUntilDue = Math.ceil(
      (subscription.nextPaymentDate - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return this.createNotification({
      userId,
      type: 'subscription_due',
      title: `Subscription Due: ${subscription.name}`,
      body: `${subscription.name} is due in ${daysUntilDue} days. Amount: ${subscription.amount}`,
      data: { subscriptionId: subscription._id },
      priority: daysUntilDue <= 3 ? 'high' : 'medium',
      actionUrl: `/subscriptions/${subscription._id}`,
    });
  }

  /**
   * Notify when goal is achieved
   */
  async notifyGoalAchieved(userId, goal) {
    return this.createNotification({
      userId,
      type: 'goal_achieved',
      title: '🎉 Goal Achieved!',
      body: `Congratulations! You've achieved your goal: ${goal.title}`,
      data: { goalId: goal._id },
      priority: 'high',
      actionUrl: `/goals/${goal._id}`,
    });
  }

  /**
   * Notify when goal progress is updated
   */
  async notifyGoalProgress(userId, goal) {
    const progressPercent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    if (progressPercent % 10 === 0) {
      return this.createNotification({
        userId,
        type: 'goal_progress',
        title: 'Goal Progress Update',
        body: `You're ${progressPercent}% towards your goal: ${goal.title}`,
        data: { goalId: goal._id },
        priority: 'low',
        actionUrl: `/goals/${goal._id}`,
      });
    }
    return null;
  }

  /**
   * Notify for password reset
   */
  async notifyPasswordReset(userId, email) {
    return this.createNotification({
      userId,
      type: 'password_reset',
      title: 'Password Reset Request',
      body: 'A password reset was requested for your account. If this was you, check your email.',
      data: { email },
      priority: 'high',
    });
  }

  /**
   * Welcome notification for new users
   */
  async notifyWelcome(userId, name) {
    return this.createNotification({
      userId,
      type: 'welcome',
      title: 'Welcome to MoneyWise AI! 👋',
      body: `Welcome ${name}! Start tracking your finances and get AI-powered insights.`,
      priority: 'medium',
      actionUrl: '/home',
    });
  }

  /**
   * Send bill reminder
   */
  async notifyBillReminder(userId, bill) {
    return this.createNotification({
      userId,
      type: 'bill_reminder',
      title: `Bill Reminder: ${bill.name}`,
      body: `${bill.name} is due on ${bill.dueDate}. Amount: ${bill.amount}`,
      data: { billId: bill._id },
      priority: 'high',
      actionUrl: `/bills/${bill._id}`,
    });
  }

  /**
   * Send weekly summary
   */
  async notifyWeeklySummary(userId, summary) {
    return this.createNotification({
      userId,
      type: 'system',
      title: '📊 Weekly Summary',
      body: `This week: Spent ${summary.spent}, Saved ${summary.saved}`,
      data: { summary },
      priority: 'medium',
      actionUrl: '/insights',
    });
  }

  /**
   * Send AI insight notification
   */
  async notifyInsight(userId, insight) {
    return this.createNotification({
      userId,
      type: 'insight',
      title: insight.title || '💡 AI Insight',
      body: insight.description || insight,
      data: { insight },
      priority: 'medium',
      actionUrl: '/insights',
    });
  }
}

module.exports = new NotificationService();