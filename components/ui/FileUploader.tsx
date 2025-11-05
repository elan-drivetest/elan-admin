// components/ui/FileUploader.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { fileService } from '@/services/fileService';

interface FileUploaderProps {
  onUpload: (url: string) => void;
  value?: string;
  label: string;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  required?: boolean;
}

export default function FileUploader({
  onUpload,
  value,
  label,
  acceptedTypes = ['image/*', '.pdf'],
  maxSize = 10,
  required = false
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isValidType) {
      setError(`Please select a valid file type: ${acceptedTypes.join(', ')}`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const response = await fileService.uploadFile(file);
      onUpload(response.url);
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err?.response?.data?.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onUpload('');
    setError(null);
  };

  const getFileIcon = (url: string) => {
    if (url.toLowerCase().includes('.pdf')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    return <ImageIcon className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className="space-y-2">
      <Label>{required ? `${label} *` : label}</Label>
      
      {value ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          {getFileIcon(value)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Uploaded successfully</p>
            <p className="text-xs text-gray-500 truncate">{value}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drop your file here or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-500">
                {acceptedTypes.join(', ')} up to {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}