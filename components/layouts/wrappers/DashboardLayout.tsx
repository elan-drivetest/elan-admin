// components/layouts/wrappers/DashboardLayout.tsx
'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from '../MobileHeader';
import Footer from '../Footer';
import { useAuth } from '@/lib/auth-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuth();

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header - Always visible on mobile */}
      <MobileHeader 
        onMenuToggle={handleMobileMenuToggle}
        isMenuOpen={isMobileMenuOpen}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop: always visible, Mobile: overlay when open */}
        <Sidebar 
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={handleMobileMenuClose}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Add top padding on mobile to account for fixed header */}
          <main className="pt-16 lg:pt-0 flex-1 space-y-6">
            {children}
          </main>
          
          {/* Footer */}
          <Footer auth={false} />
        </div>
      </div>
    </div>
  );
}