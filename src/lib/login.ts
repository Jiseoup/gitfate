const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** GitHub login rule (case-insensitive). Safe to import from client components. */
export function isValidLogin(login: string): boolean {
  return GITHUB_LOGIN.test(login);
}
