// Pure data lookup (no network), so client components can import it too.
import blocklistData from '../../data/blocklist.json';

const BLOCKED = new Set((blocklistData as string[]).map((login) => login.toLowerCase()));

export function isBlocked(login: string): boolean {
  return BLOCKED.has(login.toLowerCase());
}
