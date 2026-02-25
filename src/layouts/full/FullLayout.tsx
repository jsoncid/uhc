import { FC, useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import { Icon } from '@iconify/react';

const FullLayout: FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
            className="fixed top-1/2 -translate-y-1/2 z-50 hidden xl:flex items-center justify-center w-6 h-12 rounded-r-lg bg-primary shadow-lg hover:bg-primary/80 transition-all duration-300"
            style={{ left: sidebarOpen ? '267px' : '0px' }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Icon
              icon={sidebarOpen ? 'ri:arrow-left-s-line' : 'ri:arrow-right-s-line'}
              width={18}
              height={18}
              className="text-white"
            />
          </button>

          <div className="body-wrapper w-full bg-white dark:bg-dark">
            {/* Top Header  */}
            <Header />

            {/* Body Content  */}
            <div className={'container mx-auto px-6 py-30'}>
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
