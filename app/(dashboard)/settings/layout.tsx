// app/(dashboard)/settings/layout.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Cog, Users, Gift, TableConfig } from 'lucide-react';
import DashboardHeader from '@/components/layouts/DashboardHeader';

interface SettingsLayoutProps {
 children: React.ReactNode;
}

interface BreadcrumbItem {
 label: string;
 href: string;
 icon?: React.ComponentType<any>;
}

const SettingsBreadcrumb = () => {
 const pathname = usePathname();
 
 const getBreadcrumbItems = (): BreadcrumbItem[] => {
   const segments = pathname.split('/').filter(Boolean);
   const items: BreadcrumbItem[] = [
     { label: 'Dashboard', href: '/dashboard', icon: Home }
   ];

   if (segments.includes('settings')) {
     items.push({ label: 'Settings', href: '/settings', icon: Cog });
     
     if (segments.includes('admin-users')) {
       items.push({ label: 'Admin Users', href: '/settings/admin-users', icon: Users });
       
       if (segments.includes('create')) {
         items.push({ label: 'Create Admin', href: '/settings/admin-users/create' });
       }
     }
     
     if (segments.includes('referral-codes')) {
       items.push({ label: 'Referral Codes', href: '/settings/referral-codes', icon: Gift });
       
       const lastSegment = segments[segments.length - 1];
       if (lastSegment && lastSegment !== 'referral-codes' && !isNaN(Number(lastSegment))) {
         items.push({ label: `Code #${lastSegment}`, href: `/settings/referral-codes/${lastSegment}` });
       }
     }
     
     if (segments.includes('coupons')) {
       items.push({ label: 'Coupons', href: '/settings/coupons', icon: Gift });
       
       if (segments.includes('create')) {
         items.push({ label: 'Create Coupon', href: '/settings/coupons/create' });
       }
       
       if (segments.includes('expired')) {
         items.push({ label: 'Expired Coupons', href: '/settings/coupons/expired' });
       }
       
       if (segments.includes('usage') && !segments.some(s => !isNaN(Number(s)))) {
         items.push({ label: 'Usage Analytics', href: '/settings/coupons/usage' });
       }
       
       const couponIdIndex = segments.findIndex(s => s === 'coupons') + 1;
       const couponId = segments[couponIdIndex];
       if (couponId && !isNaN(Number(couponId))) {
         items.push({ label: `Coupon #${couponId}`, href: `/settings/coupons/${couponId}` });
         
         if (segments.includes('usage')) {
           items.push({ label: 'Usage Details', href: `/settings/coupons/${couponId}/usage` });
         }
       }
     }
   }

   return items;
 };

 const getHeaderContent = () => {
   if (pathname === '/settings') {
     return {
       title: 'Settings',
       subtitle: 'Manage system configuration, user accounts, and application preferences.'
     };
   }
   
   if (pathname === '/settings/admin-users') {
     return {
       title: 'Admin Users',
       subtitle: 'Manage administrator accounts and permissions.'
     };
   }
   
   if (pathname === '/settings/admin-users/create') {
     return {
       title: 'Create Admin User',
       subtitle: 'Add a new administrator to the system.'
     };
   }
   
   if (pathname === '/settings/referral-codes') {
     return {
       title: 'Referral Codes',
       subtitle: 'Manage instructor referral codes and track their usage.'
     };
   }
   
   if (pathname === '/settings/coupons') {
     return {
       title: 'Coupons',
       subtitle: 'Manage discount coupons and track their usage.'
     };
   }
   
   if (pathname === '/settings/coupons/create') {
     return {
       title: 'Create Coupon',
       subtitle: 'Add a new discount coupon to the system.'
     };
   }
   
   if (pathname === '/settings/coupons/expired') {
     return {
       title: 'Expired Coupons',
       subtitle: 'View and analyze expired coupon performance.'
     };
   }
   
   if (pathname === '/settings/coupons/usage') {
     return {
       title: 'Coupon Usage Analytics',
       subtitle: 'Track coupon usage across all bookings.'
     };
   }
   
   if (pathname.startsWith('/settings/referral-codes/') && pathname !== '/settings/referral-codes') {
     const codeId = pathname.split('/').pop();
     return {
       title: `Referral Code: ${codeId}`,
       subtitle: 'View and manage referral code details.'
     };
   }
   
   if (pathname.startsWith('/settings/coupons/') && pathname !== '/settings/coupons') {
     const segments = pathname.split('/');
     const couponId = segments[3];
     
     if (pathname.includes('/usage')) {
       return {
         title: `Coupon Usage Details`,
         subtitle: `Track usage for coupon #${couponId}.`
       };
     }
     
     return {
       title: `Coupon Details`,
       subtitle: `View and manage coupon #${couponId}.`
     };
   }
   
   return {
     title: 'Settings',
     subtitle: 'Manage system configuration and preferences.'
   };
 };

 const breadcrumbItems = getBreadcrumbItems();

 return (
   <nav className="flex items-center space-x-2 text-sm text-gray-600 px-6 pb-2">
     {breadcrumbItems.map((item, index) => (
       <React.Fragment key={item.href}>
         {index > 0 && <ChevronRight className="w-4 h-4" />}
         {index === breadcrumbItems.length - 1 ? (
           <div className="flex items-center text-primary font-medium">
             {item.icon && <item.icon className="w-4 h-4 mr-1" />}
             {item.label}
           </div>
         ) : (
           <Link href={item.href} className="flex items-center hover:text-primary transition-colors">
             {item.icon && <item.icon className="w-4 h-4 mr-1" />}
             {item.label}
           </Link>
         )}
       </React.Fragment>
     ))}
   </nav>
 );
};

const SettingsHeader = () => {
 const pathname = usePathname();
 
 const getHeaderContent = () => {
   // Same function content as before
   if (pathname === '/settings') {
     return {
       title: 'Settings',
       subtitle: 'Manage system configuration, user accounts, and application preferences.'
     };
   }
   
   if (pathname === '/settings/admin-users') {
     return {
       title: 'Admin Users',
       subtitle: 'Manage administrator accounts and permissions.'
     };
   }
   
   if (pathname === '/settings/admin-users/create') {
     return {
       title: 'Create Admin User',
       subtitle: 'Add a new administrator to the system.'
     };
   }
   
   if (pathname === '/settings/referral-codes') {
     return {
       title: 'Referral Codes',
       subtitle: 'Manage instructor referral codes and track their usage.'
     };
   }
   
   if (pathname.startsWith('/settings/referral-codes/') && pathname !== '/settings/referral-codes') {
     const codeId = pathname.split('/').pop();
     return {
       title: `Referral Code: ${codeId}`,
       subtitle: 'View and manage referral code details.'
     };
   }

   if (pathname.startsWith('/settings/coupons')) {
     return {
       title: 'Coupons',
       subtitle: 'Manage discount coupons and promotional codes.'
     };
   }
   
   return {
     title: 'Settings',
     subtitle: 'Manage system configuration and preferences.'
   };
 };

 const { title, subtitle } = getHeaderContent();
 
 return (
   <DashboardHeader
     title={title}
     subtitle={subtitle}
   />
 );
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
 return (
   <div className="min-h-screen bg-gray-50 space-y-6 pb-6">
     <SettingsHeader />
     <SettingsBreadcrumb />
     {children}
   </div>
 );
}