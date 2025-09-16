import AppLayout from '@/components/layout/AppLayout';
import ProfilePage from '@/components/dashboard/ProfilePage';

export default function DashboardProfilePage() {
  return (
    <AppLayout title="Profile">
      <ProfilePage />
    </AppLayout>
  );
}
