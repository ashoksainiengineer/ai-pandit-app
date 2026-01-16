import { Suspense } from 'react';
import RectifyPageContent from '@/components/RectifyPageContent';

export default function RectifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RectifyPageContent />
    </Suspense>
  );
}
