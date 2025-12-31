// components/modals/FilePreviewerModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  FileText,
  ImageIcon,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface FilePreviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  title: string;
}

type FileType = 'pdf' | 'image' | 'unknown';

export default function FilePreviewerModal({
  isOpen,
  onClose,
  fileUrl,
  title
}: FilePreviewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Reset state when modal opens/closes or URL changes
  useEffect(() => {
    if (isOpen && fileUrl) {
      setIsLoading(true);
      setHasError(false);
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen, fileUrl]);

  if (!fileUrl) return null;

  // Detect file type from URL
  const getFileType = (url: string): FileType => {
    const lowerUrl = url.toLowerCase();

    // Check for PDF
    if (lowerUrl.includes('.pdf') || lowerUrl.includes('application/pdf')) {
      return 'pdf';
    }

    // Check for common image extensions
    if (
      lowerUrl.includes('.jpg') ||
      lowerUrl.includes('.jpeg') ||
      lowerUrl.includes('.png') ||
      lowerUrl.includes('.gif') ||
      lowerUrl.includes('.webp') ||
      lowerUrl.includes('.bmp') ||
      lowerUrl.includes('.svg') ||
      lowerUrl.includes('image/')
    ) {
      return 'image';
    }

    // Default to image for S3 URLs that might not have extension
    // Most document uploads are either PDFs or images
    return 'image';
  };

  const fileType = getFileType(fileUrl);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-4xl max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {fileType === 'pdf' ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : (
                <ImageIcon className="w-5 h-5 text-blue-500" />
              )}
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between py-2 px-1 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            {fileType === 'image' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[50px] text-center">{zoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg relative min-h-[500px]">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-gray-600">Loading document...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <div>
                  <p className="font-medium text-gray-700">Unable to load document</p>
                  <p className="text-sm text-gray-500 mt-1">
                    The file may be unavailable or in an unsupported format.
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Try Opening Directly
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {fileType === 'pdf' && (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full min-h-[600px] border-0"
              title={title}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {/* Image Viewer */}
          {fileType === 'image' && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={fileUrl}
                alt={title}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          )}

          {/* Unknown File Type */}
          {fileType === 'unknown' && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <FileText className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-700">Preview not available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This file type cannot be previewed directly.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open in Browser
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
