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

// Import all module sidebars
import Module1Sidebar from './module-1/sidebaritems';
import Module2Sidebar from './module-2/sidebaritems';
import Module3Sidebar from './module-3/sidebaritems';
import Module4Sidebar from './module-4/sidebaritems';
import Module5Sidebar from './module-5/sidebaritems';

const SidebarContent: MenuItem[] = [
  // ==================== MODULE 0 ====================
  {
    heading: 'Home',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
        isPro: false,
      },
    ],
  },

  {
    heading: 'Module 0 - js0n',
    children: [
      {
        name: 'Tables',
        icon: 'solar:server-linear',
        id: uniqueId(),
        url: '/utilities/table',
      },

      {
        name: 'Blogs',
        id: uniqueId(),
        icon: 'solar:sort-by-alphabet-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Blog Post',
            url: '/apps/blog/post',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Blog Detail',
            url: '/apps/blog/detail/streaming-video-way-before-it-was-cool-go-dark-tomorrow',
            isPro: false,
          },
        ],
      },
    ],
  },

  // ==================== IMPORT OTHER MODULES ====================
  ...Module1Sidebar,
  ...Module2Sidebar,
  ...Module3Sidebar,
  ...Module4Sidebar,
  ...Module5Sidebar,

  // ==================== COMMON SECTIONS ====================
  {
    heading: 'pages',
    children: [
      {
        name: 'Tables',
        icon: 'solar:server-linear',
        id: uniqueId(),
        url: '/utilities/table',
      },
      {
        name: 'Form',
        icon: 'solar:document-add-linear',
        id: uniqueId(),
        url: '/utilities/form',
      },
      {
        id: uniqueId(),
        name: 'User Profile',
        icon: 'solar:user-circle-linear',
        url: '/user-profile',
        isPro: false,
      },
    ],
  },
  
  {
    heading: 'Apps',
    children: [
      {
        id: uniqueId(),
        name: 'Notes',
        icon: 'solar:notes-linear',
        url: '/apps/notes',
        isPro: false,
      },
      {
        id: uniqueId(),
        name: 'Tickets',
        icon: 'solar:ticker-star-linear',
        url: '/apps/tickets',
        isPro: false,
      },
      {
        name: 'Blogs',
        id: uniqueId(),
        icon: 'solar:sort-by-alphabet-linear',
        children: [
          {
            id: uniqueId(),
            name: 'Blog Post',
            url: '/apps/blog/post',
            isPro: false,
          },
          {
            id: uniqueId(),
            name: 'Blog Detail',
            url: '/apps/blog/detail/streaming-video-way-before-it-was-cool-go-dark-tomorrow',
            isPro: false,
          },
        ],
      },
    ],
  },

  {
    heading: 'Icons',
    children: [
      {
        id: uniqueId(),
        name: 'Iconify Icons',
        icon: 'solar:structure-linear',
        url: '/icons/iconify',
        isPro: false,
      },
    ],
  },
  
  {
    heading: 'Role-Based Access Control',
    children: [
      {
        id: uniqueId(),
        name: 'Assignment Management',
        icon: 'solar:clipboard-list-linear',
        url: '/rbac/assignments',
        isPro: false,
      },
      {
        id: uniqueId(),
        name: 'Module Management',
        icon: 'solar:widget-3-linear',
        url: '/rbac/modules',
        isPro: false,
      },
      {
        id: uniqueId(),
        name: 'Role Management',
        icon: 'solar:shield-user-linear',
        url: '/rbac/roles',
        isPro: false,
      },
      {
        id: uniqueId(),
        name: 'User Management',
        icon: 'solar:users-group-rounded-linear',
        url: '/rbac/user-assignments',
        isPro: false,
      },

    ],
  },
  
  {
    heading: 'Auth',
    children: [
      {
        id: uniqueId(),
        name: 'User Activation',
        icon: 'solar:login-2-linear',
        url: '/rbac/user-acceptance',
        isPro: false,
      },
    ],
  },
];

export default SidebarContent;