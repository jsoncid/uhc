import { module1Notifications } from './module-1/data';
import { module2Notifications } from './module-2/data';
import { module3Notifications } from './module-3/data';
import { module4Notifications } from './module-4/data';
import { module5Notifications } from './module-5/data';

export interface ModuleNotification {
  id: string;
  title: string;
  avatar: string;
  subtitle: string;
  timestamp: string;
}

export interface ModuleType {
  moduleId: number;
  moduleName: string;
  notifications: ModuleNotification[];
  notificationCount: number;
}

// Aggregated notifications from all modules
export const allModuleNotifications: ModuleType[] = [
  {
    moduleId: 1,
    moduleName: 'Module 1',
    notifications: module1Notifications,
    notificationCount: module1Notifications.length,
  },
  {
    moduleId: 2,
    moduleName: 'Module 2',
    notifications: module2Notifications,
    notificationCount: module2Notifications.length,
  },
  {
    moduleId: 3,
    moduleName: 'Module 3',
    notifications: module3Notifications,
    notificationCount: module3Notifications.length,
  },
  {
    moduleId: 4,
    moduleName: 'Module 4',
    notifications: module4Notifications,
    notificationCount: module4Notifications.length,
  },
  {
    moduleId: 5,
    moduleName: 'Module 5',
    notifications: module5Notifications,
    notificationCount: module5Notifications.length,
  },
];
