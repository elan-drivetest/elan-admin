// components/layouts/Footer.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  auth?: boolean;
}

export default function Footer({ auth = false }: FooterProps) {
  console.log('Footer auth prop:', auth); // Debug log to check prop value
  
  return (
    <footer className="bg-none py-4 px-6">
      <div className={cn(
        "flex items-center gap-2 text-sm text-gray-600",
        auth ? "justify-start" : "justify-center"
      )}>
        <span>Developed by</span>
        <Link 
          href="https://www.oonkoo.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src="https://www.oonkoo.com/oonkoo_logo.svg"
            alt="OonkoO Logo"
            width={20}
            height={20}
            className="h-5 w-5"
          />
          <span className="font-medium text-gray-900">OonkoO</span>
        </Link>
      </div>
    </footer>
  );
}