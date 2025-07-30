// app/(dashboard)/layout.tsx
'use client';

import Sidebar from '@/components/layouts/wrappers/Sidebar';
import RouteProtection from '@/components/auth/RouteProtection';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="h-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </RouteProtection>
  );
}