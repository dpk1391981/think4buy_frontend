import { redirect } from 'next/navigation';

/**
 * Legacy route. Login and registration were merged into a single /auth page when
 * mobile OTP was switched off — this stays as a permanent redirect so existing
 * links, bookmarks and indexed URLs keep working.
 */
export default function LegacyLoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const target = searchParams?.redirect;
  // Only internal paths are forwarded; anything else is dropped rather than
  // handed to /auth, which would otherwise inherit an open-redirect.
  const qs =
    target && target.startsWith('/') && !target.startsWith('//')
      ? `?redirect=${encodeURIComponent(target)}`
      : '';
  redirect(`/auth${qs}`);
}
