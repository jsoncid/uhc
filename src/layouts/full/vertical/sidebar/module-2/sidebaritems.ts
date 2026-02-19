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

// export const getModule2Items = (userRoleId: string, userModuleId: string) => {
//   const hasAccess =
//     userModuleId === MODULE_IDS.module2 &&
//     [ROLE_IDS.administrator, ROLE_IDS.encoder].includes(userRoleId);

//   if (!hasAccess) return [];

//   return [
//     { id: 'module2-page', title: 'Module 2 Page', href: '/module-2' },
//   ];
// };

const SidebarContent: MenuItem[] = [
  {
    heading: 'Module 2 - REFERRAL',
    children: [
      {
        name: 'Referral Management',
        id: uniqueId(),
        icon: 'solar:document-medicine-linear',
        url: '/module-2/referrals',
      },
      {
        name: 'Incoming Referrals',
        id: uniqueId(),
        icon: 'solar:inbox-linear',
        url: '/module-2/referrals/incoming',
      },
      {
        name: 'Referral History',
        id: uniqueId(),
        icon: 'solar:history-2-bold',
        url: '/module-2/referral-history',
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
