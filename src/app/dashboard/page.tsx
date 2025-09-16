import AppLayout from '@/components/layout/AppLayout';
import DashboardHome from '@/components/dashboard/DashboardHome';

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <DashboardHome />
    </AppLayout>
  );
}
