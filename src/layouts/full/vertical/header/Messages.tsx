'use client';

import { Icon } from '@iconify/react';
import { allModuleNotifications } from './notifications';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { useCurrentModule } from 'src/hooks/useCurrentModule';
import { M1Messages } from './notifications/module-1/m1_messages';

const Messages = () => {
  const currentModule = useCurrentModule();

  // Module 1 has its own dedicated notification bell with realtime queue support
  if (currentModule === 1) {
    return <M1Messages />;
  }

  // Filter notifications to the current module only
  const activeModuleNotifications = currentModule
    ? allModuleNotifications.filter((m) => m.moduleId === currentModule)
    : [];

  // Count only the current module's notifications
  const totalNotifications = activeModuleNotifications.reduce(
    (sum, module) => sum + module.notificationCount,
    0,
  );

  return (
    <div className="relative group/menu px-4 sm:px-15 ">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative">
            <span className="relative after:absolute after:w-10 after:h-10 after:rounded-full hover:text-primary after:-top-1/2 hover:after:bg-lightprimary text-foreground dark:text-muted-foreground rounded-full flex justify-center items-center cursor-pointer group-hover/menu:after:bg-lightprimary group-hover/menu:!text-primary">
              <Icon icon="tabler:bell-ringing" height={20} />
            </span>
            {totalNotifications > 0 && (
              <span className="rounded-full absolute -end-[6px] -top-[5px] text-[10px] h-2 w-2 bg-primary flex justify-center items-center"></span>
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-screen sm:w-[350px] py-6 rounded-sm border border-ld"
        >
          <div className="flex items-center px-6 justify-between">
            <h3 className="mb-0 text-lg font-semibold text-ld">Notifications</h3>
            {totalNotifications > 0 && <Badge color={'primary'}>{totalNotifications} new</Badge>}
          </div>

          <SimpleBar className="max-h-96 mt-3">
            {currentModule === null ? (
              <div className="px-6 py-8 text-center">
                <Icon
                  icon="tabler:bell-off"
                  height={32}
                  className="mx-auto mb-2 text-muted-foreground/50"
                />
                <p className="text-sm text-muted-foreground">
                  Navigate to a module to view its notifications.
                </p>
              </div>
            ) : activeModuleNotifications.length > 0 ? (
              activeModuleNotifications.map((module) => (
                <div key={module.moduleId} className="py-2">
                  {/* Module Header */}
                  <div className="px-6 py-2 bg-muted/30 sticky top-0 border-b border-ld">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{module.moduleName}</h4>
                      {module.notificationCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {module.notificationCount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Module Notifications */}
                  {module.notifications.length > 0 ? (
                    module.notifications.map((notification) => (
                      <div
                        className="px-6 py-3 flex justify-between items-center hover:bg-hover group/link w-full border-b border-ld/50 transition-colors"
                        key={notification.id}
                      >
                        <Link to="#" className="w-full">
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 relative">
                              <img
                                src={notification.avatar}
                                width={40}
                                height={40}
                                alt="avatar"
                                className="rounded-full"
                              />
                            </span>
                            <div className="flex-1 min-w-0">
                              <h5 className="mb-1 text-sm font-medium group-hover/link:text-primary truncate">
                                {notification.title}
                              </h5>
                              <span className="text-xs block truncate text-muted-foreground">
                                {notification.subtitle}
                              </span>
                              <span className="text-xs text-muted-foreground/70">
                                {notification.timestamp}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-3 text-center">
                      <span className="text-xs text-muted-foreground">No notifications</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <span className="text-xs text-muted-foreground">
                  No notifications for this module
                </span>
              </div>
            )}
          </SimpleBar>

          <div className="pt-5 px-6 border-t border-ld">
            <Button variant={'outline'} className="w-full">
              See All Notifications
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Messages;
