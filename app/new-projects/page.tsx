import type { Metadata } from 'next';
import { Suspense } from 'react';
import NewProjectsClient from './NewProjectsClient';

export const metadata: Metadata = {
  title: 'New Projects in India | Under Construction Properties',
  description: 'Explore new launch and under-construction residential and commercial projects across India. Book early and get the best prices.',
};

export default function NewProjectsPage() {
  return (
    <Suspense>
      <NewProjectsClient />
    </Suspense>
  );
}
