import avatar2 from 'src/assets/images/profile/user-3.jpg';

export interface ModuleNotification {
  id: string;
  title: string;
  avatar: string;
  subtitle: string;
  timestamp: string;
}

export const module2Notifications: ModuleNotification[] = [
  {
    id: 'm2-1',
    avatar: avatar2,
    title: 'HEYYY',
    subtitle: 'Salma sent you new message',
    timestamp: '15 mins ago',
  },
];
