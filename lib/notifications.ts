import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useState, useEffect } from 'react';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  priority?: 'default' | 'high' | 'max';
  sound?: 'default' | boolean;
}

export interface ScheduledNotification {
  id: string;
  content: any;
  trigger: any;
}

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Set notification channel for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });

        // Additional channels
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('bookings', {
          name: 'Bookings',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('payments', {
          name: 'Payments',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
        });
      }

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }

  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      return false;
    }
  }

  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return scheduledNotifications.map(notification => ({
        id: notification.identifier,
        content: notification.content,
        trigger: notification.trigger,
      }));
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
      return false;
    }
  }

  // Get notification permission status
  async getPermissionStatus(): Promise<any> {
    return await Notifications.getPermissionsAsync();
  }

  // Get device push token (for server-side push notifications)
  async getPushToken(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { data } = await Notifications.getExpoPushTokenAsync();
      return data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  // Helper methods for common notification types
  async sendBookingNotification(
    title: string,
    message: string,
    bookingId?: string
  ): Promise<string | null> {
    return this.sendLocalNotification({
      title,
      body: message,
      data: { type: 'booking', bookingId },
      channelId: 'bookings',
      priority: 'high',
    });
  }

  async sendMessageNotification(
    senderName: string,
    message: string,
    chatId?: string
  ): Promise<string | null> {
    return this.sendLocalNotification({
      title: `New message from ${senderName}`,
      body: message,
      data: { type: 'message', chatId },
      channelId: 'messages',
      priority: 'high',
    });
  }

  async sendPaymentNotification(
    title: string,
    message: string,
    paymentId?: string
  ): Promise<string | null> {
    return this.sendLocalNotification({
      title,
      body: message,
      data: { type: 'payment', paymentId },
      channelId: 'payments',
      priority: 'high',
    });
  }

  async sendPropertyUpdateNotification(
    title: string,
    message: string,
    propertyId?: string
  ): Promise<string | null> {
    return this.sendLocalNotification({
      title,
      body: message,
      data: { type: 'property', propertyId },
      channelId: 'default',
      priority: 'default',
    });
  }

  // Schedule reminder notifications
  async scheduleBookingReminder(
    title: string,
    message: string,
    bookingDate: Date,
    bookingId?: string
  ): Promise<string | null> {
    const trigger = { date: new Date(bookingDate.getTime() - 60 * 60 * 1000) } as Notifications.NotificationTriggerInput; // 1 hour before
    
    return this.scheduleNotification({
      title,
      body: message,
      data: { type: 'booking_reminder', bookingId },
      channelId: 'bookings',
      priority: 'high',
    }, trigger);
  }

  async schedulePaymentReminder(
    title: string,
    message: string,
    reminderDate: Date,
    paymentId?: string
  ): Promise<string | null> {
    const trigger = { date: reminderDate } as Notifications.NotificationTriggerInput;
    
    return this.scheduleNotification({
      title,
      body: message,
      data: { type: 'payment_reminder', paymentId },
      channelId: 'payments',
      priority: 'high',
    }, trigger);
  }
}

export const notificationService = new NotificationService();

// Hook for using notifications in components
export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      const initialized = await notificationService.initialize();
      setIsInitialized(initialized);
      
      const status = await notificationService.getPermissionStatus();
      setPermissionStatus(status);
    };

    initializeNotifications();
  }, []);

  const sendNotification = async (notification: NotificationData) => {
    return await notificationService.sendLocalNotification(notification);
  };

  const scheduleNotification = async (
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ) => {
    return await notificationService.scheduleNotification(notification, trigger);
  };

  const cancelNotification = async (notificationId: string) => {
    return await notificationService.cancelNotification(notificationId);
  };

  return {
    isInitialized,
    permissionStatus,
    sendNotification,
    scheduleNotification,
    cancelNotification,
    sendBookingNotification: notificationService.sendBookingNotification.bind(notificationService),
    sendMessageNotification: notificationService.sendMessageNotification.bind(notificationService),
    sendPaymentNotification: notificationService.sendPaymentNotification.bind(notificationService),
    sendPropertyUpdateNotification: notificationService.sendPropertyUpdateNotification.bind(notificationService),
    scheduleBookingReminder: notificationService.scheduleBookingReminder.bind(notificationService),
    schedulePaymentReminder: notificationService.schedulePaymentReminder.bind(notificationService),
  };
};
