// components/forms/ProfileEditForm.tsx
'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/types/auth';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ user, onSuccess, onCancel }: ProfileEditFormProps) {
  const { updateProfile, error, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.name || '',
      email: user.email || '',
      phone_number: user.phone || '',
      address: user.address || '',
      photo_url: user.avatar || '',
    },
  });

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    try {
      await updateProfile(data);
      onSuccess();
    } catch (error) {
      // Error is handled by auth context
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
          Full Name
        </Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Enter your full name"
          {...register('full_name')}
          className={errors.full_name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary focus:border-primary'}
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
          placeholder="Enter your email"
          {...register('email')}
          className={errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary focus:border-primary'}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
          Phone Number
        </Label>
        <Input
          id="phone_number"
          type="tel"
          placeholder="Enter your phone number"
          {...register('phone_number')}
          className="focus:ring-primary focus:border-primary"
        />
        {errors.phone_number && (
          <p className="text-sm text-red-600">{errors.phone_number.message}</p>
        )}
      </div>

      {/* Address Field */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-medium text-gray-700">
          Address
        </Label>
        <Input
          id="address"
          type="text"
          placeholder="Enter your address"
          {...register('address')}
          className="focus:ring-primary focus:border-primary"
        />
        {errors.address && (
          <p className="text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      {/* Photo URL Field */}
      <div className="space-y-2">
        <Label htmlFor="photo_url" className="text-sm font-medium text-gray-700">
          Photo URL
        </Label>
        <Input
          id="photo_url"
          type="url"
          placeholder="Enter photo URL"
          {...register('photo_url')}
          className={errors.photo_url ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary focus:border-primary'}
        />
        {errors.photo_url && (
          <p className="text-sm text-red-600">{errors.photo_url.message}</p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}