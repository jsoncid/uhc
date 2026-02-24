import avatar6 from 'src/assets/images/profile/user-7.jpg';

export interface ModuleNotification {
  id: string;
  title: string;
  avatar: string;
  subtitle: string;
  timestamp: string;
}

export const module4Notifications: ModuleNotification[] = [
  {
    id: 'm4-1',
    avatar: avatar6,
    title: 'Health Card Approved',
    subtitle: 'Maria\'s health card has been verified',
    timestamp: '30 mins ago',
  },
];
