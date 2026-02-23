import avatar3 from 'src/assets/images/profile/user-4.jpg';
import avatar4 from 'src/assets/images/profile/user-5.jpg';

export interface ModuleNotification {
  id: string;
  title: string;
  avatar: string;
  subtitle: string;
  timestamp: string;
}

export const module3Notifications: ModuleNotification[] = [
  {
    id: 'm3-1',
    avatar: avatar3,
    title: 'Bianca sent payment',
    subtitle: 'Check your earnings',
    timestamp: '2 hours ago',
  },
  {
    id: 'm3-2',
    avatar: avatar4,
    title: 'Jolly completed tasks',
    subtitle: 'Assign her new tasks',
    timestamp: '3 hours ago',
  },
];
