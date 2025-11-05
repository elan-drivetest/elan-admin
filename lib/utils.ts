import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add route utilities for sidebar
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname.startsWith(href);
}

export function getRouteDepth(pathname: string): number {
  return pathname.split('/').filter(Boolean).length;
}