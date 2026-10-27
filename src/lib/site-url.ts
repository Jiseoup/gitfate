let warnedInvalid = false;

/** `SITE_URL` as a URL (`https://` added when it has no scheme), or `null` when it is still not one. */
function configuredSiteUrl(raw: string): URL | null {
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

/** Absolute origin for metadata URLs: `SITE_URL`, else the Vercel production host, else local dev. */
export function siteUrl(): URL {
  const configured = process.env.SITE_URL?.trim();
  if (configured) {
    const url = configuredSiteUrl(configured);
    if (url) return url;
    if (!warnedInvalid) {
      warnedInvalid = true;
      console.warn(`[gitfate] SITE_URL ${JSON.stringify(configured)} is not a valid URL; ignoring it`);
    }
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return new URL('http://localhost:3000');
}
