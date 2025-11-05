// components/layouts/wrappers/Sidebar.tsx
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Route,
  Users,
  GraduationCap,
  Settings,
  LogOut,
  UserCog,
  ChevronRight,
  Menu,
  X,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const navigationItems = [
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
    icon: Route,
  },
  {
    title: 'Refunds',
    href: '/refunds',
    icon: DollarSign,
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
];

const accountItems = [
  {
    title: 'Profile',
    href: '/profile',
    icon: UserCog,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ onMobileClose }: { onMobileClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    onMobileClose?.();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      {/* Logo Section - Only show on desktop, mobile header handles logo */}
      <div className="hidden lg:flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/elan-logo.svg"
            alt="Elan Logo"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Mobile: Add top padding and logo */}
      <div className="lg:hidden pt-4 px-6 pb-2">
        <Link href="/dashboard" className="flex items-center" onClick={handleLinkClick}>
          <Image
            src="/elan-logo.svg"
            alt="Elan Logo"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <item.icon className={cn(
                'mr-3 h-5 w-5',
                isActive(item.href) ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              {item.title}
              {isActive(item.href) && (
                <ChevronRight className="ml-auto h-4 w-4 text-primary" />
              )}
            </Link>
          ))}
        </div>

        {/* Account Section */}
        <div className="pt-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Account
            </h3>
          </div>
          <div className="space-y-1">
            {accountItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon className={cn(
                  'mr-3 h-5 w-5',
                  isActive(item.href) ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                )} />
                {item.title}
                {isActive(item.href) && (
                  <ChevronRight className="ml-auto h-4 w-4 text-primary" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border border-primary/20 rounded-lg p-4 m-4 mt-0 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="flex items-center px-1 py-2 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3 overflow-hidden">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user?.name || 'User Avatar'}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            onMobileClose?.();
          }}
          className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-white/50 border border-transparent hover:border-gray-200 transition-all duration-200"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  // Close mobile sidebar when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onMobileClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, onMobileClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out">
            <SidebarContent onMobileClose={onMobileClose} />
          </div>
        </div>
      )}
    </>
  );
}

// Mobile Menu Button Component
export function MobileMenuButton({ 
  onClick, 
  isOpen 
}: { 
  onClick: () => void; 
  isOpen: boolean; 
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="p-2 hover:bg-gray-100 rounded-md"
      aria-label="Toggle menu"
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
    </Button>
  );
}