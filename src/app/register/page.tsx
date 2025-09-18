import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Register feature temporarily disabled - redirect to login
  redirect('/login');
}
