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

//RESTRICTION: This is to prevent unauthorized users from even seeing the menu items of modules they don't have access to.

// import { MODULE_IDS, ROLE_IDS } from 'src/constants/moduleAccess';

// export const getModule1Items = (userRoleId: string, userModuleId: string) => {
//   const hasAccess =
//     userModuleId === MODULE_IDS.module1 &&
//     [ROLE_IDS.administrator].includes(userRoleId);

//   if (!hasAccess) return [];

//   return [
//     { id: 'module1-page', title: 'Module 1 Page', href: '/module-1' },
//   ];
// };

const SidebarContent: MenuItem[] = [
  {
    heading: 'Module 1 - QUEUEING',
    children: [
      {
        name: 'Tables',
        icon: 'solar:server-linear',
        id: uniqueId(),
        url: '/module-1/table',
      },
      {
        name: 'Admin Page',
        icon: 'solar:settings-linear',
        id: uniqueId(),
        url: '/module-1/admin',
      },
      {
        name: 'Queue Generator',
        icon: 'solar:ticket-linear',
        id: uniqueId(),
        url: '/module-1/queue-generator',
      },
      {
        name: 'Queue Display',
        icon: 'solar:monitor-linear',
        id: uniqueId(),
        url: '/module-1/queue-display',
      },
      {
        name: 'Staff Queue Manager',
        icon: 'solar:user-check-linear',
        id: uniqueId(),
        url: '/module-1/staff-queue-manager',
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
