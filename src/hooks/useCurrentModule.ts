import { useLocation } from 'react-router';

/**
 * Detects the current module based on the URL path.
 * Routes follow the pattern /module-{N}/...
 *
 * @returns The current module number (1-5) or null if not on a module page.
 */
export function useCurrentModule(): number | null {
  const { pathname } = useLocation();
  const match = pathname.match(/^\/module-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
