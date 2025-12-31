// components/modals/CreateReferralCodeModal.tsx
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gift, DollarSign, Hash, Loader2 } from 'lucide-react';
import { adminService } from '@/services/admin';
import { toast } from 'sonner';
import type { CreateReferralCodeRequest } from '@/types/admin';

interface CreateReferralCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateReferralCodeModal({
  isOpen,
  onClose,
  onSuccess
}: CreateReferralCodeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [minRidesRequired, setMinRidesRequired] = useState('5');

  const resetForm = () => {
    setCode('');
    setAmount('');
    setMinRidesRequired('5');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ADMIN';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!code.trim()) {
      setError('Referral code is required');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!minRidesRequired || parseInt(minRidesRequired) < 1) {
      setError('Minimum rides required must be at least 1');
      return;
    }

    const payload: CreateReferralCodeRequest = {
      code: code.trim().toUpperCase(),
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      min_rides_required: parseInt(minRidesRequired)
    };

    setIsSubmitting(true);
    try {
      await adminService.createReferralCode(payload);
      toast.success('Referral code created successfully');
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to create referral code';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Create Referral Code
          </DialogTitle>
          <DialogDescription>
            Create a new admin referral code for instructors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Code Field */}
          <div className="space-y-2">
            <Label htmlFor="code">Referral Code</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="code"
                  type="text"
                  placeholder="e.g., ADMIN2023"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="pl-10 font-mono uppercase"
                  disabled={isSubmitting}
                  maxLength={20}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomCode}
                disabled={isSubmitting}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Unique code that instructors will use for referrals
            </p>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                disabled={isSubmitting}
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500">
              Bonus amount awarded when the referral conditions are met
            </p>
          </div>

          {/* Min Rides Required Field */}
          <div className="space-y-2">
            <Label htmlFor="minRides">Minimum Rides Required</Label>
            <Input
              id="minRides"
              type="number"
              placeholder="e.g., 5"
              value={minRidesRequired}
              onChange={(e) => setMinRidesRequired(e.target.value)}
              disabled={isSubmitting}
              min="1"
              step="1"
            />
            <p className="text-xs text-gray-500">
              Number of rides the referred instructor must complete before the bonus is awarded
            </p>
          </div>

          {/* Preview */}
          {code && amount && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Preview</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Code:</span>
                <span className="font-mono font-medium">{code.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bonus:</span>
                <span className="font-medium text-green-600">${parseFloat(amount || '0').toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Min Rides:</span>
                <span className="font-medium">{minRidesRequired || '0'}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !code || !amount}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Create Code
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
