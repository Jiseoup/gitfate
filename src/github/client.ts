const API = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 8000;
/** Enough for any patch header block; the `Date:` line is its third line. */
const HEADER_MAX_BYTES = 8192;

export class GitHubRateLimitError extends Error {
  constructor() {
    super('GitHub API rate limit reached');
    this.name = 'GitHubRateLimitError';
  }
}

export class GitHubUnavailableError extends Error {
  constructor(reason: string) {
    super(`GitHub API unavailable: ${reason}`);
    this.name = 'GitHubUnavailableError';
  }
}

let reportedMissingToken = false;

function headersFor(accept: string): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    // A configuration problem, not an outage: say so once, then let pages show the "unavailable" state.
    if (!reportedMissingToken) {
      reportedMissingToken = true;
      console.error('[gitfate] GITHUB_TOKEN is not set; every GitHub request is skipped');
    }
    throw new GitHubUnavailableError('GITHUB_TOKEN is not set');
  }
  return {
    authorization: `Bearer ${token}`,
    accept,
    'x-github-api-version': '2022-11-28',
    'user-agent': 'gitfate',
  };
}

function isRateLimited(res: Response): boolean {
  if (res.status === 429) return true;
  if (res.status !== 403) return false;
  return res.headers.get('x-ratelimit-remaining') === '0' || res.headers.has('retry-after');
}

function cacheOption(revalidate: number | undefined): RequestInit {
  return revalidate === undefined ? { cache: 'no-store' } : { next: { revalidate } };
}

/**
 * Sends the request (with a timeout that also bounds reading the body) and maps failures to typed errors.
 * Never reads or reports the body of a failed response.
 */
async function send(url: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    throw new GitHubUnavailableError(timedOut ? 'timeout' : 'network error');
  }
  if (isRateLimited(res)) throw new GitHubRateLimitError();
  return res;
}

interface GraphqlEnvelope<T> {
  data?: T | null;
  errors?: { type?: string }[];
}

/** Returns the `data` of a GraphQL response. Without `revalidate` the request bypasses Next's data cache. */
export async function githubGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  revalidate?: number,
): Promise<T> {
  const res = await send(`${API}/graphql`, {
    method: 'POST',
    headers: { ...headersFor('application/json'), 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    ...cacheOption(revalidate),
  });
  if (!res.ok) throw new GitHubUnavailableError(`status ${res.status}`);
  let json: GraphqlEnvelope<T>;
  try {
    json = (await res.json()) as GraphqlEnvelope<T>;
  } catch {
    throw new GitHubUnavailableError('invalid response');
  }
  if (json.errors?.some((e) => e.type === 'RATE_LIMITED')) throw new GitHubRateLimitError();
  if (json.data == null) throw new GitHubUnavailableError(json.errors ? 'query error' : 'empty response');
  return json.data;
}

/** Reads the body only up to its first blank line (at most HEADER_MAX_BYTES), then cancels the rest. */
async function readHeaderBlock(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    while (bytes < HEADER_MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
      const end = text.search(/\r?\n\r?\n/);
      if (end !== -1) return text.slice(0, end);
    }
    return text.slice(0, HEADER_MAX_BYTES);
  } finally {
    reader.cancel().catch(() => {});
  }
}

/**
 * GET a REST path and return only the header block of the response text (up to the first blank line),
 * or null when GitHub answers 404. Always `no-store`, so Next's data cache never holds the body.
 */
export async function githubRestHeader(path: string, accept: string): Promise<string | null> {
  const res = await send(`${API}${path}`, { headers: headersFor(accept), ...cacheOption(undefined) });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubUnavailableError(`status ${res.status}`);
  try {
    return await readHeaderBlock(res);
  } catch {
    throw new GitHubUnavailableError('invalid response');
  }
}
