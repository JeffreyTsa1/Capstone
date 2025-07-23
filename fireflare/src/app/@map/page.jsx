import { Suspense } from 'react';
import MapComponent from '@/components/MapComponent';

const Page = () => {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <MapComponent />
    </Suspense>
  )
}

export default Page