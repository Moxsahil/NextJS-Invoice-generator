import { prisma } from './db';
import { NotificationType, NotificationCategory, CreateNotificationData } from '@/types/notification';

class NotificationService {
  private static instance: NotificationService;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category,
          userId: data.userId,
          metadata: data.metadata || {},
        },
      });

      this.broadcastToUser(data.userId, {
        type: 'notification',
        data: notification,
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return { notifications, unreadCount };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      await prisma.notification.update({
        where: { 
          id: notificationId,
          userId: userId 
        },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      await prisma.notification.delete({
        where: { 
          id: notificationId,
          userId: userId 
        },
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  subscribe(userId: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(userId)) {
      this.eventListeners.set(userId, new Set());
    }
    this.eventListeners.get(userId)?.add(callback);

    return () => {
      this.eventListeners.get(userId)?.delete(callback);
      if (this.eventListeners.get(userId)?.size === 0) {
        this.eventListeners.delete(userId);
      }
    };
  }

  private broadcastToUser(userId: string, data: any) {
    const listeners = this.eventListeners.get(userId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error broadcasting to listener:', error);
        }
      });
    }
  }

  async createInvoiceNotification(
    type: 'created' | 'sent' | 'paid' | 'overdue',
    userId: string,
    invoiceData: { invoiceNumber: string; customerName: string; amount: number }
  ) {
    const notifications = {
      created: {
        title: 'Invoice Created',
        message: `Invoice ${invoiceData.invoiceNumber} created for ${invoiceData.customerName}`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.INVOICE_CREATED,
      },
      sent: {
        title: 'Invoice Sent',
        message: `Invoice ${invoiceData.invoiceNumber} sent to ${invoiceData.customerName}`,
        type: NotificationType.INFO,
        category: NotificationCategory.INVOICE_SENT,
      },
      paid: {
        title: 'Payment Received',
        message: `Payment of ₹${invoiceData.amount} received for invoice ${invoiceData.invoiceNumber}`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.INVOICE_PAID,
      },
      overdue: {
        title: 'Invoice Overdue',
        message: `Invoice ${invoiceData.invoiceNumber} for ${invoiceData.customerName} is overdue`,
        type: NotificationType.WARNING,
        category: NotificationCategory.INVOICE_OVERDUE,
      },
    };

    const notificationData = notifications[type];
    return this.createNotification({
      ...notificationData,
      userId,
      metadata: invoiceData,
    });
  }

  async createCustomerNotification(
    type: 'new' | 'updated',
    userId: string,
    customerData: { name: string; email: string }
  ) {
    const notifications = {
      new: {
        title: 'New Customer Added',
        message: `Customer ${customerData.name} has been added`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.NEW_CUSTOMER,
      },
      updated: {
        title: 'Customer Updated',
        message: `Customer ${customerData.name} information has been updated`,
        type: NotificationType.INFO,
        category: NotificationCategory.CUSTOMER_UPDATED,
      },
    };

    const notificationData = notifications[type];
    return this.createNotification({
      ...notificationData,
      userId,
      metadata: customerData,
    });
  }
}

export const notificationService = NotificationService.getInstance();