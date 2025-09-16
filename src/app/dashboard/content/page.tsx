import AppLayout from '@/components/layout/AppLayout';
import ContentPage from '@/components/dashboard/ContentPage';

export default function ContentPageRoute() {
  return (
    <AppLayout title="Content Management">
      <ContentPage />
    </AppLayout>
  );
}
