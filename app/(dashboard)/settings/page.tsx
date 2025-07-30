// app/(dashboard)/settings/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  Settings as SettingsIcon, 
  UserPlus, 
  Database,
  ChevronRight
} from 'lucide-react';

const settingsItems = [
  {
    title: 'Admin Users',
    description: 'Manage admin accounts and permissions',
    icon: Users,
    href: '/settings/admin-users',
    action: 'Manage Users',
  },
  {
    title: 'System Settings',
    description: 'Configure system preferences and defaults',
    icon: SettingsIcon,
    href: '/settings/system',
    action: 'Configure',
    disabled: true,
  },
  {
    title: 'Security',
    description: 'Manage security settings and access controls',
    icon: Shield,
    href: '/settings/security',
    action: 'Manage Security',
    disabled: true,
  },
  {
    title: 'Data Management',
    description: 'Backup, export, and data management tools',
    icon: Database,
    href: '/settings/data',
    action: 'Manage Data',
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader
        title="Settings"
        subtitle="Manage system settings, users, and configurations."
        actions={
          <Link href="/settings/admin-users/create">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </Link>
        }
      />

      <div className="px-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsItems.map((item) => (
            <Card key={item.href} className={item.disabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600 font-normal">
                      {item.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {item.disabled ? (
                  <Button variant="outline" disabled className="w-full">
                    Coming Soon
                  </Button>
                ) : (
                  <Link href={item.href}>
                    <Button variant="outline" className="w-full group">
                      {item.action}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/settings/admin-users/create">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <UserPlus className="w-6 h-6 text-primary" />
                  <span>Create New Admin</span>
                </Button>
              </Link>
              
              <Link href="/settings/admin-users">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  <span>View All Admins</span>
                </Button>
              </Link>
              
              <Button variant="outline" disabled className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Database className="w-6 h-6 text-gray-400" />
                <span>Export Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}