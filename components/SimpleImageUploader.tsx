'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useWordPress } from '@/hooks/useWordPress';
import { Upload, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SimpleImageUploaderProps {
  onImageSelect: (imageData: string, description?: string) => void;
  onClose?: () => void;
  className?: string;
}

export const SimpleImageUploader: React.FC<SimpleImageUploaderProps> = ({
  onImageSelect,
  onClose,
  className = ''
}) => {
  const { uploadMedia, site } = useWordPress();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to WordPress if connected
    if (site?.isConnected) {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      try {
        const media = await uploadMedia(file, (progress) => {
          setUploadProgress(progress);
        });

        // Use WordPress URL
        onImageSelect(media.source_url, file.name);
        setUploading(false);
      } catch (err) {
        console.error('Upload failed:', err);
        setError(err instanceof Error ? err.message : 'Upload failed');
        setUploading(false);
      }
    } else {
      // Use base64 for preview/editing
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onImageSelect(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  }, [site, uploadMedia, onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
    },
    multiple: false
  });

  const handleRemovePreview = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className={`simple-image-uploader ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
              />
              <button
                onClick={handleRemovePreview}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div className="space-y-2">
                <CheckCircle className="h-6 w-6 mx-auto text-green-500" />
                <p className="text-sm text-gray-600">Image ready! Click to upload another.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isDragActive ? 'Drop the image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WEBP, SVG up to 10MB
                </p>
              </div>
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleImageUploader;
