import AppLayout from '@/components/layout/AppLayout';
import IgAccountsPage from '@/components/dashboard/IgAccountsPage';

export default function IgAccountsPageRoute() {
  return (
    <AppLayout title="IG Accounts">
      <IgAccountsPage />
    </AppLayout>
  );
}
