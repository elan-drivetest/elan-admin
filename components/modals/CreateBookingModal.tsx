// components/modals/CreateBookingModal.tsx - Enhanced with Loading/Success/Error States
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle, Loader2, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CreateBookingForm from '@/components/forms/CreateBookingForm';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (booking: any) => void;
}

type ModalState = 'form' | 'loading' | 'success' | 'error';

export default function CreateBookingModal({
  isOpen,
  onClose,
  onSuccess
}: CreateBookingModalProps) {
  const [modalState, setModalState] = useState<ModalState>('form');
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (booking: any) => {
    setCreatedBooking(booking);
    setModalState('success');
    
    // Auto-close after 2 seconds and trigger parent success
    setTimeout(() => {
      onSuccess?.(booking);
      handleClose();
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setModalState('error');
  };

  const handleLoading = () => {
    setModalState('loading');
  };

  const handleClose = () => {
    // Reset state when closing
    setModalState('form');
    setCreatedBooking(null);
    setError(null);
    onClose();
  };

  const handleRetry = () => {
    setModalState('form');
    setError(null);
  };

  const renderContent = () => {
    switch (modalState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Booking...</h3>
            <p className="text-sm text-gray-600 text-center">
              Please wait while we process your booking request. This may take a few moments.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Created Successfully!</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              The booking has been created and the customer will receive a confirmation email.
            </p>
            {createdBooking && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full max-w-md">
                <h4 className="text-sm font-medium text-green-800 mb-2">Booking Details:</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p>Booking ID: #{createdBooking.id}</p>
                  <p>Customer: {createdBooking.customer_name || 'Customer'}</p>
                  <p>Test Date: {new Date(createdBooking.test_date).toLocaleDateString()}</p>
                  <p>Status: {createdBooking.status}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-4">
              This dialog will close automatically...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Creation Failed</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              We encountered an error while creating the booking. Please try again.
            </p>
            
            <Alert variant="destructive" className="mb-6 max-w-md">
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={handleRetry}
                className="bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <CreateBookingForm
              onSuccess={handleSuccess}
              onError={handleError}
              onLoading={handleLoading}
              onCancel={handleClose}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-6xl max-h-[95vh] overflow-y-auto p-0 ${modalState !== 'form' ? 'sm:max-w-lg' : ''}`}>
        {modalState === 'form' && (
          <div className="p-6 border-b border-gray-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-6 h-6 text-green-600" />
                Create New Booking
              </DialogTitle>
            </DialogHeader>
          </div>
        )}

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}