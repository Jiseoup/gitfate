/** The GitHub avatar URL asking GitHub for a `size`-px image (its `s` parameter); unparseable URLs pass through. */
export function sizedAvatarUrl(avatarUrl: string, size: number): string {
  try {
    const url = new URL(avatarUrl);
    url.searchParams.set('s', String(size));
    return url.href;
  } catch {
    return avatarUrl;
  }
}
