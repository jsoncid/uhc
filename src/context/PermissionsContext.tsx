import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

// ── Types ────────────────────────────────────────────────────

/** One row returned by the `get_user_permissions` RPC. */
export interface ModulePermission {
  module_id: string;
  module_description: string;
  is_select: boolean;
  is_insert: boolean;
  is_update: boolean;
  is_delete: boolean;
}

/** CRUD action names the helper understands. */
export type PermissionAction = 'select' | 'insert' | 'update' | 'delete';

interface PermissionsContextValue {
  /** Raw permission rows – one per role×module combination. */
  permissions: ModulePermission[];
  /** True while the initial RPC is in-flight. */
  loading: boolean;
  /** Non-null if the RPC failed. */
  error: string | null;
  /**
   * Check whether the current user may perform `action` on `moduleName`.
   *
   * `moduleName` is matched against `module_description` (case-insensitive).
   * If the user has several roles that each grant access to the same module,
   * **any** `true` value across those rows counts as granted (logical OR).
   */
  checkAccess: (moduleName: string, action: PermissionAction) => boolean;
  /** Force a re-fetch (e.g. after an admin changes roles). */
  refetch: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);

  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const fetchPermissions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_user_permissions');

      if (rpcError) {
        if (rpcError.code === 'PGRST302' || rpcError.message?.includes('404')) {
          console.warn(
            '[PermissionsProvider] get_user_permissions() RPC not found. ' +
              'Run the SQL migration in src/sql/get_user_permissions.sql to enable RBAC.',
          );
          setPermissions([]);
          return;
        }
        throw rpcError;
      }

      const perms = (data as ModulePermission[]) ?? [];
      
      setPermissions((prev) => {
        const changed = JSON.stringify(prev) !== JSON.stringify(perms);
        if (import.meta.env.DEV && changed) {
          console.log(
            '[PermissionsProvider] Permissions updated:',
            perms.length,
            'rows',
          );
        }
        return changed ? perms : prev;
      });

      if (import.meta.env.DEV && !hasFetchedOnce) {
        console.log(
          '[PermissionsProvider] Initial fetch:',
          perms.length,
          'permission rows',
        );
        if (perms.length === 0) {
          console.warn(
            '[PermissionsProvider] No permissions returned. Ensure:\n' +
              '  1. user_role row exists for this user\n' +
              '  2. role_module_access rows link the role to page-level modules\n' +
              '  3. module rows exist with is_active = true\n' +
              '  4. module.description matches PAGE_MODULES values exactly',
          );
        }
      }
      setHasFetchedOnce(true);
    } catch (err) {
      console.error('[PermissionsProvider] Failed to fetch permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [hasFetchedOnce]);

  // Fetch once when the user becomes available; clear on sign-out.
  useEffect(() => {
    if (user) {
      fetchPermissions();
    } else if (!isAuthLoading) {
      // Only clear permissions if auth is done loading and user is actually null
      // (i.e., user signed out). Don't clear during initial auth loading.
      setPermissions([]);
      setLoading(false);
      setError(null);
    }
    // If isAuthLoading is true and user is null, keep loading: true (initial state)
  }, [user, isAuthLoading, fetchPermissions]);

  // Re-fetch permissions when the browser tab regains focus.
  // This picks up admin changes (e.g. role_module_access edits) without
  // requiring a full page reload.
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPermissions(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchPermissions]);

  // Listen for realtime changes to role_module_access so the sidebar
  // updates immediately when an admin adds/removes module access.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('rbac-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_module_access' },
        () => {
          fetchPermissions(true);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_role' },
        () => {
          fetchPermissions(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPermissions]);

  // Build a lookup map so `checkAccess` is O(1).
  const accessMap = useMemo(() => {
    const map = new Map<string, Record<PermissionAction, boolean>>();

    for (const p of permissions) {
      const key = (p.module_description ?? '').toLowerCase().trim();
      // Skip rows with empty descriptions — they can't be matched
      if (!key) continue;

      const existing = map.get(key);

      if (existing) {
        // OR flags across rows (multiple roles may grant partial access)
        existing.select = existing.select || p.is_select;
        existing.insert = existing.insert || p.is_insert;
        existing.update = existing.update || p.is_update;
        existing.delete = existing.delete || p.is_delete;
      } else {
        map.set(key, {
          select: p.is_select,
          insert: p.is_insert,
          update: p.is_update,
          delete: p.is_delete,
        });
      }
    }

    return map;
  }, [permissions]);

  const checkAccess = useCallback(
    (moduleName: string, action: PermissionAction): boolean => {
      const key = moduleName.toLowerCase().trim();
      if (!key) return false;

      // Exact match only — page-level modules must match precisely.
      const entry = accessMap.get(key);
      const result = entry?.[action] ?? false;

      if (import.meta.env.DEV && !result) {
        console.debug(
          `[checkAccess] DENIED "${moduleName}" / "${action}"`,
          '| available:',
          [...accessMap.keys()],
        );
      }

      return result;
    },
    [accessMap],
  );

  const refetch = useCallback(() => fetchPermissions(false), [fetchPermissions]);

  const value = useMemo<PermissionsContextValue>(
    () => ({ permissions, loading, error, checkAccess, refetch }),
    [permissions, loading, error, checkAccess, refetch],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

// ── Hook ─────────────────────────────────────────────────────

export const usePermissions = (): PermissionsContextValue => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within a <PermissionsProvider>');
  }
  return ctx;
};
