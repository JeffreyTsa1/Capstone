import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import MapComponent from '@/components/MapComponent';

export default function Default() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapComponent />
    </Suspense>
  )
};
