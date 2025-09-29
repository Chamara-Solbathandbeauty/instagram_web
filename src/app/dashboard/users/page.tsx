import AppLayout from '@/components/layout/AppLayout';
import UsersPage from '@/components/dashboard/UsersPage';

export default function DashboardUsersPage() {
  return (
    <AppLayout title="Users Management">
      <UsersPage />
    </AppLayout>
  );
}
