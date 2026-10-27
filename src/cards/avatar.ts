import { sizedAvatarUrl } from '@/lib/avatar-url';

const AVATAR_REVALIDATE = 604800;
const SUPPORTED = /^image\/(png|jpeg|gif)$/;

/**
 * The GitHub avatar as a data URL at `size` px, or `null` (the card then draws an initial instead).
 * Fetched here rather than by the renderer so a slow or missing avatar never fails the card.
 */
export async function loadAvatar(avatarUrl: string, size: number): Promise<string | null> {
  try {
    const res = await fetch(sizedAvatarUrl(avatarUrl, size), { next: { revalidate: AVATAR_REVALIDATE } });
    const type = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!res.ok || !SUPPORTED.test(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}
