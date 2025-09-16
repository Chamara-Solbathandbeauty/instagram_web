import AppLayout from '@/components/layout/AppLayout';
import SchedulesPage from '@/components/dashboard/SchedulesPage';

export default function Schedules() {
  return (
    <AppLayout title="Posting Schedules" allowedRoles={['user', 'admin']}>
      <SchedulesPage />
    </AppLayout>
  );
}
