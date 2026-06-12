// components/modals/CreateBookingModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
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
    toast.success(
      booking?.id ? `Booking #${booking.id} created successfully` : 'Booking created successfully'
    );
    onSuccess?.(booking);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <div className="p-6 border-b border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6 text-green-600" />
              Create New Booking
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 bg-gray-50/60">
          <CreateBookingForm
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
