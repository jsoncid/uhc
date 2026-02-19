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
import { MODULE_IDS, ROLE_IDS } from 'src/constants/moduleAccess';

export const getModule4Items = (userRoleId: string, userModuleId: string) => {
  if (userModuleId !== MODULE_IDS.module4) return [];

  const items = [];

  // module4Operator can only see operator page
  if (userRoleId === ROLE_IDS.module4Operator) {
    items.push({ id: 'operator', title: 'Health Card Operator', href: '/module-4/operator' });
  }

  // module4Member can only see member page
  if (userRoleId === ROLE_IDS.module4Member) {
    items.push({ id: 'member', title: 'Health Card Holder', href: '/module-4/member' });
  }

  return items;
};

const SidebarContent: MenuItem[] = [
  {
    heading: 'Module 4 - HEALTH CARD',
    children: [
      {
        name: 'Health Card Holder',
        icon: 'line-md:account-small',
        id: uniqueId(),
        url: '/module-4/member',
        },
        
        {
        name: 'Health Card Operator',
        icon: 'line-md:person-filled',
        id: uniqueId(),
        url: '/module-4/operator',
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
