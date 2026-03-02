import queueIcon from 'src/assets/images/svgs/icon-inbox.svg';

export interface ModuleNotification {
  id: string;
  title: string;
  avatar: string;
  subtitle: string;
  timestamp: string;
}

// Static notifications (empty - using real-time queue notifications instead)
export const module1Notifications: ModuleNotification[] = [];

// Queue notification icon for real-time notifications
export const queueNotificationIcon = queueIcon;
