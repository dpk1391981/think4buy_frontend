import { redirect } from 'next/navigation';

export default function CommercialPage() {
  redirect('/properties?category=commercial');
}
