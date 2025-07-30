// components/auth/SessionExpiredModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionExpiredModal({ isOpen, onClose }: SessionExpiredModalProps) {
  const { refreshAuth, logout, isLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefreshSession = async () => {
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      await refreshAuth();
      onClose();
    } catch (error: any) {
      setRefreshError(
        error?.response?.data?.message || 
        'Failed to refresh session. Please log in again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  // Auto-close if user becomes authenticated
  useEffect(() => {
    if (!isOpen) {
      setRefreshError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Session Expired
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Your session has expired for security reasons. Please refresh your session or log in again to continue.
            </AlertDescription>
          </Alert>

          {refreshError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {refreshError}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRefreshSession}
              disabled={isRefreshing || isLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing Session...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Session
                </>
              )}
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              disabled={isRefreshing || isLoading}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}