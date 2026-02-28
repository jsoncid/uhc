'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { useNotificationStore } from 'src/stores/module-1_stores/useNotificationStore';
import { useOfficeUserAssignmentStore } from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { queueNotificationIcon } from './data';

const M1Messages = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { myAssignment, myAssignmentLoaded, fetchMyAssignment } = useOfficeUserAssignmentStore();
  const {
    notifications,
    subscribeToSequenceChanges,
    loadRecentSequences,
    markAllAsRead,
    clearNotifications,
    purgeNotificationsForOtherOffices,
  } = useNotificationStore();

  // Fetch this user's specific office assignment
  useEffect(() => {
    if (!profileLoading && profile?.id) {
      fetchMyAssignment(profile.id);
    }
  }, [profileLoading, profile?.id, fetchMyAssignment]);

  // Once assignment loads, purge any stale notifications from other offices
  useEffect(() => {
    if (myAssignmentLoaded && myAssignment?.office) {
      purgeNotificationsForOtherOffices(myAssignment.office);
    }
  }, [myAssignmentLoaded, myAssignment?.office, purgeNotificationsForOtherOffices]);

  // Use ref to track if we've subscribed (avoids re-render loops)
  const hasSubscribedRef = useRef(false);
  const officeIdsRef = useRef<string[]>([]);

  // Subscribe to real-time sequence changes only for the user's assigned office
  useEffect(() => {
    if (!myAssignmentLoaded) return;
    if (!profile?.id) return;

    const officeIds = myAssignment?.office ? [myAssignment.office] : [];
    const officeIdsKey = officeIds.join(',');
    const prevOfficeIdsKey = officeIdsRef.current.join(',');

    if (officeIds.length > 0 && (!hasSubscribedRef.current || officeIdsKey !== prevOfficeIdsKey)) {
      hasSubscribedRef.current = true;
      officeIdsRef.current = officeIds;

      loadRecentSequences(officeIds, profile.id);

      const unsubscribe = subscribeToSequenceChanges(officeIds);
      return () => {
        hasSubscribedRef.current = false;
        unsubscribe();
      };
    }
  }, [myAssignmentLoaded, myAssignment?.office, subscribeToSequenceChanges, loadRecentSequences]);

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative group/menu px-4 sm:px-15 ">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative">
            <span className="relative after:absolute after:w-10 after:h-10 after:rounded-full hover:text-primary after:-top-1/2 hover:after:bg-lightprimary text-foreground dark:text-muted-foreground rounded-full flex justify-center items-center cursor-pointer group-hover/menu:after:bg-lightprimary group-hover/menu:!text-primary">
              <Icon icon="tabler:bell-ringing" height={20} />
            </span>
            {unreadCount > 0 && (
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
            {unreadCount > 0 && <Badge color={'primary'}>{unreadCount} new</Badge>}
          </div>

          <SimpleBar className="max-h-96 mt-3">
            {notifications.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Icon
                  icon="tabler:bell-check"
                  height={32}
                  className="mx-auto mb-2 text-muted-foreground/50"
                />
                <span className="text-xs text-muted-foreground">No queue activity yet</span>
              </div>
            ) : (
              <div className="py-2">
                <div className="px-6 py-2 bg-muted/30 sticky top-0 border-b border-ld">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Queue Activity</h4>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => markAllAsRead()}
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2 text-destructive hover:text-destructive"
                        onClick={() => profile?.id && clearNotifications(profile.id)}
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>
                </div>

                {notifications.slice(0, 10).map((notification) => (
                  <div
                    className={`px-6 py-3 flex justify-between items-center hover:bg-hover group/link w-full border-b border-ld/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    key={notification.id}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="shrink-0 relative">
                        <img
                          src={queueNotificationIcon}
                          width={40}
                          height={40}
                          alt="queue"
                          className="rounded-full bg-primary/10 p-2"
                        />
                        {!notification.read && (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="mb-1 text-sm font-medium group-hover/link:text-primary truncate">
                          Queue {notification.queueCode} generated
                        </h5>
                        <span className="text-xs block truncate text-muted-foreground">
                          {notification.officeName} • {notification.priorityType}
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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

export { M1Messages };
export default M1Messages;
