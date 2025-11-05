// components/layouts/MobileHeader.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileMenuButton } from './wrappers/Sidebar';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export default function MobileHeader({ onMenuToggle, isMenuOpen }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <MobileMenuButton 
            onClick={onMenuToggle}
            isOpen={isMenuOpen}
          />
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/elan-logo.svg"
              alt="Elan Logo"
              width={100}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
        </div>
        
        <div className="text-sm font-medium text-gray-600">
          Admin Panel
        </div>
      </div>
    </header>
  );
}