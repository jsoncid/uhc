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
    heading: 'Module 3 - PATIENT REPOSITORY',
    children: [
      {
        name: 'Patient List',
        icon: 'solar:users-group-rounded-linear',
        id: uniqueId(),
        url: '/module-3/patient-list',
        module: PAGE_MODULES.MODULE_3_PATIENT_LIST,
      },
      {
        name: 'Patient Profiling',
        icon: 'solar:user-circle-linear',
        id: uniqueId(),
        url: '/module-3/patient-profiling',
        module: PAGE_MODULES.MODULE_3_PATIENT_PROFILING,
      },
      {
        name: 'Patient Tagging',
        id: uniqueId(),
        icon: 'solar:tag-linear',
        url: '/module-3/patient-tagging',
        module: PAGE_MODULES.MODULE_3_PATIENT_TAGGING,
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
