'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useWordPress } from '@/hooks/useWordPress';
import { Upload, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface MediaUploaderProps {
  onImageSelect: (media: any) => void;
  onClose: () => void;
  isOpen: boolean;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onImageSelect,
  onClose,
  isOpen,
}) => {
  const { uploadMedia, getMedia, site } = useWordPress();
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    if (!site?.isConnected) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getMedia({ per_page: 20 });
      setMedia(result.media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [getMedia, site]);

  React.useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, loadMedia]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!site?.isConnected) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of acceptedFiles) {
        const uploadedMedia = await uploadMedia(file, (progress) => {
          setUploadProgress(progress);
        });
        
        // Add to media list
        setMedia(prev => [uploadedMedia, ...prev]);
        
        // Auto-select the uploaded image
        onImageSelect(uploadedMedia);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [uploadMedia, onImageSelect, site]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 50, 
      padding: 'var(--space-4)' 
    }}>
      <div style={{ 
        background: '#fff', 
        border: 'var(--space-2) solid #000', 
        maxWidth: '64rem', 
        width: '100%', 
        maxHeight: '80vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: 'var(--space-6)', 
          borderBottom: 'var(--space-2) solid #000' 
        }}>
          <h2 style={{ fontSize: 'var(--space-5)', fontWeight: '800', margin: 0 }}>Media Library</h2>
          <button
            onClick={onClose}
            style={{ 
              padding: 'var(--space-2)', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div style={{ padding: 'var(--space-6)', borderBottom: 'var(--space-2) solid #000' }}>
          <div
            {...getRootProps()}
            style={{
              border: 'var(--space-2) dashed #000',
              padding: 'var(--space-8)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isDragActive ? '#f9fafb' : '#fff',
              opacity: uploading ? 0.5 : 1,
              pointerEvents: uploading ? 'none' : 'auto'
            }}
          >
            <input {...getInputProps()} />
            <div>
              <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: '#6b7280' }} />
              <p style={{ fontSize: '1.125rem', fontWeight: '800', margin: '0 0 var(--space-2) 0' }}>
                {isDragActive ? 'Drop images here' : 'Upload images'}
              </p>
              <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
                Drag & drop images here, or click to select
              </p>
              <p className="muted" style={{ fontSize: 'var(--space-3)' }}>
                Supports: JPG, PNG, GIF, WebP, SVG (max 10MB each)
              </p>
            </div>
          </div>

          {uploading && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginBottom: 'var(--space-2)' 
              }}>
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                background: '#f3f4f6', 
                height: 'var(--space-2)', 
                border: 'var(--space-1) solid #000' 
              }}>
                <div
                  style={{ 
                    background: '#000', 
                    height: '100%', 
                    transition: 'all 0.3s ease',
                    width: `${uploadProgress}%` 
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="error" style={{ marginTop: 'var(--space-4)' }}>
              <AlertCircle className="h-5 w-5 inline mr-2" />
              {error}
            </div>
          )}
        </div>

        {/* Media Grid */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: 'var(--space-6)' 
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '8rem' 
            }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#000' }} />
              <span className="muted" style={{ marginLeft: 'var(--space-2)' }}>Loading media...</span>
            </div>
          ) : media.length === 0 ? (
            <div className="center" style={{ padding: '3rem 0' }}>
              <ImageIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#6b7280' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '800', margin: '0 0 var(--space-2) 0' }}>No media found</h3>
              <p className="muted">Upload some images to get started</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(var(--space-120), 1fr))', 
              gap: 'var(--space-4)' 
            }}>
              {media.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    background: '#f9fafb',
                    border: 'var(--space-1) solid #000',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden'
                  }}
                  onClick={() => onImageSelect(item)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  <div style={{ aspectRatio: '1', position: 'relative' }}>
                    <img
                      src={item.media_details?.sizes?.thumbnail?.source_url || item.source_url}
                      alt={item.alt_text || item.title?.rendered || 'Media item'}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      background: 'rgba(0, 0, 0, 0)', 
                      transition: 'all 0.2s ease', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <CheckCircle className="h-6 w-6" style={{ 
                        color: '#fff', 
                        opacity: 0, 
                        transition: 'opacity 0.2s' 
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ padding: 'var(--space-2)' }}>
                    <p style={{ 
                      fontSize: 'var(--space-3)', 
                      fontWeight: '700', 
                      margin: '0 0 var(--space-1) 0', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {item.title?.rendered || 'Untitled'}
                    </p>
                    <p className="muted" style={{ fontSize: 'var(--space-3)', margin: '0 0 var(--space-1) 0' }}>
                      {item.media_details?.width} × {item.media_details?.height}
                    </p>
                    <p className="muted" style={{ fontSize: 'var(--space-3)', margin: 0 }}>
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: 'var(--space-6)', 
          borderTop: 'var(--space-2) solid #000', 
          background: '#f9fafb' 
        }}>
          <div className="muted" style={{ fontSize: '0.875rem' }}>
            {media.length} {media.length === 1 ? 'item' : 'items'}
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaUploader;
export { MediaUploader };
