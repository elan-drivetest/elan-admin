// components/modals/ProcessRefundModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RefundRequest } from '@/types/refund';
import ProcessRefundForm from '@/components/forms/ProcessRefundForm';

interface ProcessRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  refund: RefundRequest;
  onSuccess?: () => void;
}

export default function ProcessRefundModal({
  isOpen,
  onClose,
  refund,
  onSuccess
}: ProcessRefundModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Refund Request #{refund.id}</DialogTitle>
          <DialogDescription>
            Review and approve or reject this refund request for {refund.customer_name}
          </DialogDescription>
        </DialogHeader>

        <ProcessRefundForm
          refund={refund}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
