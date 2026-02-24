import avatar5 from 'src/assets/images/profile/user-6.jpg';

export interface ModuleNotification {
  id: string;
  title: string;
  avatar: string;
  subtitle: string;
  timestamp: string;
}

export const module5Notifications: ModuleNotification[] = [
  {
    id: 'm5-1',
    avatar: avatar5,
    title: 'John received payment',
    subtitle: '$230 deducted from account',
    timestamp: '1 hour ago',
  },
];
