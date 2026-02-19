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

// export const getModule3Items = (userRoleId: string, userModuleId: string) => {
//   const hasAccess =
//     userModuleId === MODULE_IDS.module3 &&
//     [ROLE_IDS.administrator, ROLE_IDS.infoOfficer].includes(userRoleId);

//   if (!hasAccess) return [];

//   return [
//     { id: 'module3-page', title: 'Module 3 Page', href: '/module-3' },
//   ];
// };

const SidebarContent: MenuItem[] = [
  {
    heading: 'Module 3 - PATIENT REPOSITORY',
    children: [
      {
        name: 'Patient Profiling',
        icon: 'solar:user-circle-linear',
        id: uniqueId(),
        url: '/module-3/patient-profiling',
      },
      {
        name: 'Patient Tagging',
        id: uniqueId(),
        icon: 'solar:history-linear',
        url: '/module-3/tagging/overview',
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
