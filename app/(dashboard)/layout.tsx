// app/(dashboard)/layout.tsx
import DashboardLayout from '@/components/layouts/wrappers/DashboardLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}