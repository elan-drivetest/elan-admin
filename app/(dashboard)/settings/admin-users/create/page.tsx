// app/(dashboard)/settings/admin-users/create/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import CreateAdminForm from '@/components/forms/CreateAdminForm';

export default function CreateAdminPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/settings/admin-users');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <DashboardHeader
        title="Create Admin User"
        subtitle="Add a new administrator to the system."
        actions={
          <Link href="/settings/admin-users">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Users
            </Button>
          </Link>
        }
      />

      <div className="px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Admin User Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateAdminForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin User Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">New admin users will have access to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Dashboard and analytics</li>
                <li>Customer management</li>
                <li>Instructor management</li>
                <li>Booking oversight</li>
                <li>Ride session tracking</li>
                <li>Profile management</li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="font-medium mb-1 text-blue-800">Security Note:</p>
              <p className="text-blue-700">
                Admin users cannot create other admin users or access system settings by default. 
                These permissions require super admin access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}