// components/forms/CreateAdminForm.tsx
'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import { authService } from '@/services/auth';

const createAdminSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone_number: z
    .string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 digits'),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

interface CreateAdminFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateAdminForm({ onSuccess, onCancel }: CreateAdminFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone_number: '',
    },
  });

  const onSubmit: SubmitHandler<CreateAdminFormData> = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.createAdmin(data);
      
      setSuccess(true);
      reset();
      
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
      
    } catch (error: any) {
      console.error('Create admin error:', error);
      setError(
        error?.response?.data?.message || 
        'Failed to create admin user. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Enter full name"
          {...register('full_name')}
          className={errors.full_name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary focus:border-primary'}
          disabled={isLoading}
        />
        {errors.full_name && (
          <p className="text-sm text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          {...register('email')}
          className={errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary focus:border-primary'}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Phone Number Field */}
      <div className="space-y-2">
        <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
          Phone Number
        </Label>
        <Input
          id="phone_number"
          type="tel"
          placeholder="Enter phone number"
          {...register('phone_number')}
          className={errors.phone_number ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary focus:border-primary'}
          disabled={isLoading}
        />
        {errors.phone_number && (
          <p className="text-sm text-red-600">{errors.phone_number.message}</p>
        )}
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Admin user created successfully! They will receive login credentials via email.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || success}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Admin...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Admin User
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>

      {/* Info Note */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">Note:</p>
        <p>The new admin user will receive an email with login instructions and a temporary password that must be changed on first login.</p>
      </div>
    </form>
  );
}