import { redirect } from 'next/navigation';

export default function PGPage() {
  redirect('/properties?category=pg');
}
