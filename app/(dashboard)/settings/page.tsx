// app/(dashboard)/settings/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  ChevronRight,
  Gift,
  Cog,
  UsersIcon,
  Zap,
  TableConfig,
  Shield,
  Settings,
  Database,
  TrendingUp,
  MapPin,
  Building2
} from 'lucide-react';
import SystemSettingsSection from '@/components/sections/SystemSettingsSection';
import { useSystemSettings } from '@/hooks/useAdmin';
import LoadingState from '@/components/ui/loading-state';
import type { SystemSetting } from '@/types/admin';

interface SettingsItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  action: string;
  iconBg: string;
  iconColor: string;
  disabled?: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  disabled?: boolean;
}

const userManagementItems: SettingsItem[] = [
  {
    title: 'Admin Users',
    description: 'Manage administrator accounts and permissions',
    icon: Users,
    href: '/settings/admin-users',
    action: 'Manage Users',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Test Centers',
    description: 'Manage drive test center locations and pricing',
    icon: Building2,
    href: '/settings/test-centers',
    action: 'Manage Centers',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    title: 'Referral Codes',
    description: 'Manage instructor referral codes and track usage',
    icon: Gift,
    href: '/settings/referral-codes',
    action: 'Manage Codes',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    title: 'Coupons',
    description: 'Manage discount coupons and promotional codes',
    icon: Gift,
    href: '/settings/coupons',
    action: 'Manage Coupons',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
];

const quickActions: QuickAction[] = [
  {
    title: 'Create New Admin',
    description: 'Add a new administrator to the system',
    icon: UserPlus,
    href: '/settings/admin-users/create',
    color: 'bg-green-50/80 hover:bg-green-100/80 text-green-700 border border-emerald-500/20',
  },
  {
    title: 'View All Admins',
    description: 'Manage existing administrator accounts',
    icon: UsersIcon,
    href: '/settings/admin-users',
    color: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-200/60',
  },
  {
    title: 'Test Centers',
    description: 'Manage drive test center locations',
    icon: MapPin,
    href: '/settings/test-centers',
    color: 'bg-orange-50/80 hover:bg-orange-100/80 text-orange-700 border border-orange-200/60',
  },
  {
    title: 'View Referral Codes',
    description: 'Manage instructor referral codes',
    icon: Gift,
    href: '/settings/referral-codes',
    color: 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/60',
  },
  {
    title: 'Create Coupon',
    description: 'Add new discount coupon & manage',
    icon: Gift,
    href: '/settings/coupons/create',
    color: 'bg-violet-50/80 hover:bg-violet-100/80 text-violet-700 border border-violet-200/60',
  },
];

const SettingsCard = ({ items, title }: { items: SettingsItem[], title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg text-gray-900">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {items.map((item) => (
        <div key={item.href} className={`group ${item.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
          <Link href={item.href}>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all group-hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${item.iconBg} group-hover:scale-105 transition-transform`}>
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.action}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default function SettingsPage() {
  const { data: systemSettings, isLoading: settingsLoading, error: settingsError, refetch } = useSystemSettings();

  const handleSettingUpdate = (updatedSetting: SystemSetting) => {
    refetch(); // Refresh all settings after update
  };

  return (
    <div className="flex gap-8 px-6">
      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {/* Settings Overview */}
        <Card className="border-primary/20 bg-gradient-to-r from-transparent to-primary/5">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Cog className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
                <p className="text-gray-600">
                  Configure and manage your Elan admin system settings, user access, and application preferences.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TableConfig className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Configurations</h2>
          </div>
          <SettingsCard items={userManagementItems} title="All Available Configurations" />
        </div>

        {/* System Settings Section - Added Here */}
        {settingsLoading ? (
          <LoadingState card text="Loading system settings..." />
        ) : settingsError ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-red-600">
                <p className="font-medium">Error loading system settings</p>
                <p className="text-sm mt-1">{settingsError.message}</p>
                <button 
                  onClick={() => refetch()} 
                  className="mt-3 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <SystemSettingsSection 
            settings={systemSettings || []} 
            onSettingUpdate={handleSettingUpdate}
          />
        )}

        {/* System Information - Redesigned */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-mono text-gray-600 flex items-center gap-2">
              <Database className="w-4 h-4" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-mono font-semibold text-blue-900">Admin User Management</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Create, edit, and manage administrator accounts with different roles and permissions.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <h3 className="font-mono font-semibold text-green-900">Referral Codes</h3>
                </div>
                <p className="text-sm text-green-700">
                  Manage instructor referral codes to incentivize user sign-ups and track referrals.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <h3 className="font-mono font-semibold text-purple-900">Coupons Management</h3>
                </div>
                <p className="text-sm text-purple-700">
                  Create and manage discount coupons for promotional campaigns and user incentives.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h3 className="font-mono font-semibold text-gray-900">System Settings</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Configure application settings, user roles, and system preferences.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Sidebar */}
      <div className="hidden md:block w-80 space-y-4">
        <div className="sticky top-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          
          <Card className="border-primary/20 bg-gradient-to-t from-primary/5 via-transparent to-transparent">
            <CardContent>
              <div className="space-y-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className={`w-full p-4 mb-1 rounded-xl ${action.color} hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3 group`}>
                      <div className="p-2 bg-stone-600/5 bg-clip-padding backdrop-filter backdrop-blur-xl bg-opacity-10 border border-gray-100 rounded-md">
                        <action.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs opacity-90">{action.description}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}