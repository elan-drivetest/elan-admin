// components/modals/AssignInstructorModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, GraduationCap, Star, Phone, Car, CheckCircle } from 'lucide-react';
import { useBookingInstructors } from '@/hooks/useAdmin';
import { adminService } from '@/services/admin';
import type { BookingInstructor, AssignInstructorRequest } from '@/types/admin';

interface AssignInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number | null;
  currentInstructorId?: number;
  onSuccess?: () => void;
}

export default function AssignInstructorModal({
  isOpen,
  onClose,
  bookingId,
  currentInstructorId,
  onSuccess
}: AssignInstructorModalProps) {
  const { data: instructors, isLoading, error, refetch } = useBookingInstructors();
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(currentInstructorId || null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedInstructorId(currentInstructorId || null);
      setAssignError(null);
    }
  }, [isOpen, currentInstructorId]);

  const handleAssign = async () => {
    if (!bookingId || !selectedInstructorId) return;

    try {
      setIsAssigning(true);
      setAssignError(null);

      const assignData: AssignInstructorRequest = {
        booking_id: bookingId,
        instructor_id: selectedInstructorId,
      };

      await adminService.assignInstructor(assignData);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Assign instructor error:', error);
      
      let errorMessage = 'Failed to assign instructor. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please refresh your session.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAssignError(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const InstructorCard = ({ instructor }: { instructor: BookingInstructor }) => (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        selectedInstructorId === instructor.user_id
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedInstructorId(instructor.user_id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{instructor.fullName}</h3>
              {selectedInstructorId === instructor.user_id && (
                <CheckCircle className="w-4 h-4 text-primary" />
              )}
            </div>
            
            {instructor.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">{instructor.rating.toFixed(1)}</span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{instructor.phoneNumber}</span>
              </div>
              {instructor.vehicle_info && (
                <div className="flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  <span>{instructor.vehicle_info}</span>
                </div>
              )}
            </div>

            {instructor.email && (
              <div className="text-xs text-gray-500 mt-1">
                {instructor.email}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge 
            className={
              instructor.is_available !== false
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }
          >
            {instructor.is_available !== false ? 'Available' : 'Busy'}
          </Badge>
          
          {currentInstructorId === instructor.user_id && (
            <Badge variant="outline" className="text-xs">
              Current
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Assign Instructor {bookingId && `(Booking #${bookingId})`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2">Loading instructors...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <div>{error.message}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refetch}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Assign Error */}
          {assignError && (
            <Alert variant="destructive">
              <AlertDescription>{assignError}</AlertDescription>
            </Alert>
          )}

          {/* Debug info - only in development */}
          {process.env.NODE_ENV === 'development' && !isLoading && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              <p>Found {instructors.length} instructors</p>
              <p>Booking ID: {bookingId}</p>
              <p>Current Instructor ID: {currentInstructorId}</p>
            </div>
          )}

          {/* Instructors List */}
          {!isLoading && !error && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {instructors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No instructors available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refetch}
                    className="mt-2"
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                instructors.map((instructor) => (
                  <InstructorCard key={instructor.user_id} instructor={instructor} />
                ))
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isAssigning}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedInstructorId || isAssigning || !bookingId}
              className="bg-primary hover:bg-primary/90"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Instructor'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}