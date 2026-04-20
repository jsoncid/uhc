//Apps Links Type & Data
interface appsLinkType {
  href: string;
  title: string;
  subtext: string;
  avatar: string;
}

const appsLink: appsLinkType[] = [
  {
    href: '/apps/chats',
    title: 'Chat Application',
    subtext: 'New messages arrived',
    avatar: 'src/assets/images/svgs/icon-dd-chat.svg',
  },
  {
    href: '/apps/ecommerce/shop',
    title: 'eCommerce App',
    subtext: 'New stock available',
    avatar: 'src/assets/images/svgs/icon-dd-cart.svg',
  },
  {
    href: '/apps/notes',
    title: 'Notes App',
    subtext: 'To-do and Daily tasks',
    avatar: 'src/assets/images/svgs/icon-dd-invoice.svg',
  },
  {
    href: '/apps/calendar',
    title: 'Calendar App',
    subtext: 'Get dates',
    avatar: 'src/assets/images/svgs/icon-dd-date.svg',
  },
  {
    href: '/apps/contacts',
    title: 'Contact Application',
    subtext: '2 Unsaved Contacts',
    avatar: 'src/assets/images/svgs/icon-dd-mobile.svg',
  },
  {
    href: '/apps/tickets',
    title: 'Tickets App',
    subtext: 'Submit tickets',
    avatar: 'src/assets/images/svgs/icon-dd-lifebuoy.svg',
  },
  {
    href: '/apps/email',
    title: 'Email App',
    subtext: 'Get new emails',
    avatar: 'src/assets/images/svgs/icon-dd-message-box.svg',
  },
  {
    href: '/apps/blog/post',
    title: 'Blog App',
    subtext: 'added new blog',
    avatar: 'src/assets/images/svgs/icon-dd-application.svg',
  },
];

interface LinkType {
  href: string;
  title: string;
}

const pageLinks: LinkType[] = [
  {
    href: '/theme-pages/pricing',
    title: 'Pricing Page',
  },
  {
    href: '/auth/auth1/login',
    title: 'Authentication Design',
  },
  {
    href: '/auth/auth1/register',
    title: 'Register Now',
  },
  {
    href: '/404',
    title: '404 Error Page',
  },
  {
    href: '/apps/kanban',
    title: 'Kanban App',
  },
  {
    href: '/apps/user-profile/profile',
    title: 'User Application',
  },
  {
    href: '/apps/blog/post',
    title: 'Blog Design',
  },
  {
    href: '/apps/ecommerce/checkout',
    title: 'Shopping Cart',
  },
];

//   Search Data
interface SearchType {
  href: string;
  title: string;
}

const SearchLinks: SearchType[] = [
  {
    title: 'Analytics',
    href: '/dashboards/analytics',
  },
  {
    title: 'eCommerce',
    href: '/dashboards/eCommerce',
  },
  {
    title: 'CRM',
    href: '/dashboards/crm',
  },
  {
    title: 'Contacts',
    href: '/dashboards/eCommerce',
  },
  {
    title: 'Posts',
    href: '/dashboards/posts',
  },
  {
    title: 'Details',
    href: '/dashboards/details',
  },
];

//   Module Notification Data
// Notifications are now organized by module in the notifications folder
// Each module has its own data file under notifications/module-*/data.ts
// The main Messages component imports all notifications from notifications/index.ts



//  Profile Data
interface ProfileType {
  title: string;
  img: string;
  subtitle: string;
  url: string;
  icon: string
}

import acccountIcon from 'src/assets/images/svgs/icon-account.svg';
import inboxIcon from 'src/assets/images/svgs/icon-inbox.svg';
import taskIcon from 'src/assets/images/svgs/icon-tasks.svg';

const profileDD: ProfileType[] = [
  {
    img: acccountIcon,
    title: 'My Profile',
    subtitle: 'Account settings',
    icon: "tabler:user",
    url: '/user-profile',
  },
  {
    img: taskIcon,
    title: 'Settings',
    subtitle: 'System preferences',
    icon: "solar:settings-bold-duotone",
    url: '/settings',
  },
];

export { appsLink, pageLinks, SearchLinks, profileDD };
