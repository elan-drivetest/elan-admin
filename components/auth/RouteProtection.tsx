// components/auth/RouteProtection.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer' | 'manager';
  fallbackUrl?: string;
}

export default function RouteProtection({ 
  children, 
  requiredRole,
  fallbackUrl = '/login' 
}: RouteProtectionProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.push(fallbackUrl);
        return;
      }

      // Check role-based access
      if (requiredRole && user?.role !== requiredRole) {
        // User doesn't have required role
        if (user?.role === 'manager' && requiredRole === 'admin') {
          // Manager trying to access admin-only content
          router.push('/dashboard?error=insufficient_permissions');
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, fallbackUrl]);

  // Show loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  // Role check failed
  if (requiredRole && user?.role !== requiredRole) {
    return <UnauthorizedScreen />;
  }

  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function UnauthorizedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl">🚫</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">
          {"You don't have permission to access this page."}
        </p>
      </div>
    </div>
  );
}