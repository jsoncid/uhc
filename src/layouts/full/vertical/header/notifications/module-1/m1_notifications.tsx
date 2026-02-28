'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Button } from 'src/components/ui/button';
import { useNotificationStore } from 'src/stores/module-1_stores/useNotificationStore';
import { useOfficeUserAssignmentStore } from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { queueNotificationIcon } from './data';

const M1Notifications = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { myAssignment, myAssignmentLoaded, fetchMyAssignment } = useOfficeUserAssignmentStore();
  const {
    notifications,
    subscribeToSequenceChanges,
    loadRecentSequences,
    markAllAsRead,
    clearNotifications,
  } = useNotificationStore();

  // Fetch this user's specific office assignment
  useEffect(() => {
    if (!profileLoading && profile?.id) {
      fetchMyAssignment(profile.id);
    }
  }, [profileLoading, profile?.id, fetchMyAssignment]);

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

  if (notifications.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <Icon
          icon="tabler:bell-check"
          height={32}
          className="mx-auto mb-2 text-muted-foreground/50"
        />
        <span className="text-xs text-muted-foreground">No queue activity yet</span>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-6 py-2 bg-muted/30 sticky top-0 border-b border-ld">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Queue Activity</h4>
          </div>
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
  );
};

export { M1Notifications };
export default M1Notifications;
