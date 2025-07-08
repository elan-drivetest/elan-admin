// app/(dashboard)/customers/page.tsx
'use client';

import React from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CustomersTable from '@/components/tables/CustomersTable';
import { mockCustomerMetrics, mockCustomers } from '@/lib/customers-mock-data';

export default function CustomersPage() {
  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Customers"
        subtitle="Manage customer accounts and track their progress."
      />

      {/* Key Metrics */}
      <KeyMetrics metrics={mockCustomerMetrics} />

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* All Customers Table */}
        <CustomersTable 
          title="All Customer"
          data={mockCustomers}
        />
      </div>
    </>
  );
}