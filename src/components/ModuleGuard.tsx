/**
 * @deprecated – Use `<ModuleRoute>` from `src/components/ModuleRoute.tsx` instead.
 * ModuleGuard relied on the old single-module-per-user pattern (useAuthStore.userModuleId).
 * The new page-level RBAC uses PermissionsContext + checkAccess().
 */
export {};