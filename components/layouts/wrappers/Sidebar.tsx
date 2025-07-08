// components/layouts/wrappers/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Car, 
  Users, 
  GraduationCap, 
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bookings',
    href: '/bookings',
    icon: Calendar,
  },
  {
    title: 'Ride Sessions',
    href: '/sessions',
    icon: Car,
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Instructors',
    href: '/instructors',
    icon: GraduationCap,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
        <Image
          src="/elan-logo.svg"
          alt="Elan Logo"
          width={100}
          height={32}
          className="h-8 w-full object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 p-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-100',
                isActive 
                  ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5',
                isActive ? 'text-primary' : 'text-gray-500'
              )} />
              <div className="flex flex-col">
                <span>{item.title}</span>
                {/* <span className={cn(
                  'text-xs',
                  isActive ? 'text-primary/70' : 'text-gray-500'
                )}>
                  {item.description}
                </span> */}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            {user?.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.name} 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-gray-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 text-gray-600 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}