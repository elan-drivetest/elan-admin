// components/modals/CreateBookingModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';
import CreateBookingForm from '@/components/forms/CreateBookingForm';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (booking: any) => void;
}

export default function CreateBookingModal({
  isOpen,
  onClose,
  onSuccess
}: CreateBookingModalProps) {
  const handleSuccess = (booking: any) => {
    onSuccess?.(booking);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Create New Booking
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <CreateBookingForm
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}