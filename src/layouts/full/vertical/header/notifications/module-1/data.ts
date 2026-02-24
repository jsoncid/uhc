import avatar1 from 'src/assets/images/profile/user-2.jpg';

export interface ModuleNotification {
  id: string;
  title: string;
  avatar: string;
  subtitle: string;
  timestamp: string;
}

export const module1Notifications: ModuleNotification[] = [
  {
    id: 'm1-1',
    avatar: avatar1,
    title: 'Roman Joined the Team!',
    subtitle: 'Congratulate him',
    timestamp: '5 mins ago',
  },
];
