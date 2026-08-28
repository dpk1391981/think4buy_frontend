/**
 * Where the "Login" entry points send people.
 *
 * The navbar (desktop header and the mobile bottom bar) links to the standalone
 * /auth page rather than opening the modal. A login started from the navbar is a
 * deliberate "I want to sign in" with no task behind it, and a real page gives it
 * something the modal cannot: a URL to bookmark, share, deep-link and hit
 * directly, plus a full-height layout that has room for the email → password/OTP
 * branch on a phone without fighting the keyboard for space.
 *
 * The modal stays for the contextual triggers — saving a property, revealing a
 * phone number, tapping "Post Property" — where navigating away would throw out
 * the thing the visitor was in the middle of.
 */

/** Paths that must never become a post-login return target. */
function isAuthPath(pathname: string): boolean {
  return pathname === '/auth' || pathname.startsWith('/auth/');
}

/**
 * Builds the sign-in href, carrying `pathname` as the page to return to.
 *
 * Only internal paths are ever forwarded: /auth reads `redirect` back through
 * `safeRedirect`, and handing it anything absolute or protocol-relative would
 * turn the login screen into an open redirect.
 */
export function loginHref(pathname?: string | null): string {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) return '/auth';
  // Returning to an auth screen after signing in would just bounce in place.
  if (isAuthPath(pathname)) return '/auth';
  return `/auth?redirect=${encodeURIComponent(pathname)}`;
}
