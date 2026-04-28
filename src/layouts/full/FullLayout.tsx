import { FC, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import { Icon } from '@iconify/react';

const FullLayout: FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const isQueueDisplayRoute =
    location.pathname.startsWith('/queueing/queue-display') ||
    location.pathname.startsWith('/module-1/queue-display');

  const contentClassName = isQueueDisplayRoute
    ? 'w-full max-w-none p-0'
    : sidebarOpen
      ? 'container mx-auto px-6 py-30'
      : 'w-full max-w-none px-6 py-30';

  const queueDisplayToggleBase =
    'fixed top-1/2 -translate-y-1/2 z-50 hidden xl:flex items-center justify-center h-16 w-5 rounded-r-xl bg-primary shadow-lg hover:bg-primary/80 transition-all duration-300 hover:w-10 focus-visible:w-10 overflow-hidden';
  const toggleButtonClassName = isQueueDisplayRoute
    ? sidebarOpen
      ? `${queueDisplayToggleBase} opacity-100`
      : `${queueDisplayToggleBase} opacity-0 hover:opacity-100 focus-visible:opacity-100`
    : 'fixed top-1/2 -translate-y-1/2 z-50 hidden xl:flex items-center justify-center w-6 h-12 rounded-r-lg bg-primary shadow-lg hover:bg-primary/80 transition-all duration-300';
  const toggleIconSize = isQueueDisplayRoute ? 22 : 18;

  return (
    <>
      <div className="flex w-full min-h-screen">
        <div
          className="page-wrapper flex w-full"
          style={{
            marginLeft: sidebarOpen ? undefined : 0,
            transition: 'margin-left 0.3s ease-in',
          }}
        >
          {/* Sidebar */}
          <div className="xl:block hidden">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
          </div>

          {/* Single toggle button fixed to the sidebar edge */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className={toggleButtonClassName}
            style={{ left: sidebarOpen ? '267px' : '0px' }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Icon
              icon={sidebarOpen ? 'ri:arrow-left-s-line' : 'ri:arrow-right-s-line'}
              width={toggleIconSize}
              height={toggleIconSize}
              className="text-white"
            />
          </button>

          <div className="body-wrapper w-full bg-white dark:bg-dark">
            {/* Top Header  */}
            {!isQueueDisplayRoute && <Header />}

            {/* Body Content  */}
            <div className={contentClassName}>
              <main className="grow">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FullLayout;
