export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: string;
  children?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  isPro?: boolean;
  module?: string;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: string;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  isPro?: boolean;
}

import { uniqueId } from 'lodash';
import { PAGE_MODULES } from 'src/constants/moduleAccess';

const SidebarContent: MenuItem[] = [
  {
    heading: 'Module 1 - QUEUEING',
    children: [
      {
        name: 'Admin Page',
        icon: 'solar:settings-linear',
        id: uniqueId(),
        url: '/module-1/admin',
        module: PAGE_MODULES.MODULE_1_ADMIN,
      },
      {
        name: 'Queue Generator',
        icon: 'solar:ticket-linear',
        id: uniqueId(),
        url: '/module-1/queue-generator',
        module: PAGE_MODULES.MODULE_1_QG,
      },
      {
        name: 'Queue Display',
        icon: 'solar:monitor-linear',
        id: uniqueId(),
        url: '/module-1/queue-display',
        module: PAGE_MODULES.MODULE_1_QD,
      },
      {
        name: 'Staff Queue Manager',
        icon: 'solar:user-check-linear',
        id: uniqueId(),
        url: '/module-1/staff-queue-manager',
        module: PAGE_MODULES.MODULE_1_SQM,
      },
    ],
  },
  // {
  //   heading: 'Auth',
  //   children: [
  //     {
  //       name: 'Login',
  //       id: uniqueId(),
  //       icon: 'solar:login-2-linear',
  //       children: [
  //         {
  //           id: uniqueId(),
  //           name: 'Boxed Login',
  //           url: '/auth/auth2/login',
  //           isPro: false,
  //         },
  //       ],
  //     },
  //     {
  //       name: 'Register',
  //       id: uniqueId(),
  //       icon: 'solar:user-plus-rounded-linear',
  //       children: [
  //         {
  //           id: uniqueId(),
  //           name: 'Boxed Register',
  //           url: '/auth/auth2/register',
  //           isPro: false,
  //         },
  //       ],
  //     },
  //   ],
  // },
];

export default SidebarContent;
