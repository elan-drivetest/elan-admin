// components/modals/ChangePasswordModal.tsx
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormErrorAlert from '@/components/ui/form-error-alert';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { authService } from '@/services/auth';
import { getApiErrorMessages } from '@/lib/utils';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswords(false);
    setErrorMessages([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessages([]);

    // Client-side validation
    if (!currentPassword) {
      setErrorMessages(['Current password is required']);
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessages(['New password must be at least 6 characters']);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessages(['New password and confirmation do not match']);
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessages(['New password must be different from your current password']);
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.updateProfile({ password: newPassword, oldPassword: currentPassword });
      toast.success('Password changed successfully');
      handleClose();
    } catch (error) {
      setErrorMessages(getApiErrorMessages(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormErrorAlert messages={errorMessages} />

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter new password"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((s) => !s)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
