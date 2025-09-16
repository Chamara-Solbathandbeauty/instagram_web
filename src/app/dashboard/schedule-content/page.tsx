import { Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ScheduleContentPage from '@/components/dashboard/ScheduleContentPage';

export default function ScheduleContentPageRoute() {
  return (
    <AppLayout title="Schedule Content" allowedRoles={['user', 'admin']}>
      <Suspense fallback={<div>Loading...</div>}>
        <ScheduleContentPage />
      </Suspense>
    </AppLayout>
  );
}
