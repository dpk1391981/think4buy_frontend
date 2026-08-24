import { redirect } from 'next/navigation';

/**
 * Legacy route. Registration now lives on /auth, which decides between the
 * password box and the signup form from the email address alone. Kept as a
 * redirect so existing links and indexed URLs keep working.
 */
export default function LegacyRegisterPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const target = searchParams?.redirect;
  const qs =
    target && target.startsWith('/') && !target.startsWith('//')
      ? `?redirect=${encodeURIComponent(target)}`
      : '';
  redirect(`/auth${qs}`);
}
