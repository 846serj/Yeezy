"use client";
import React, { FC, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
// Removed React95 imports - using Bootstrap/386 components

interface Props {
  isOpen: boolean;
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedImageUrl: string) => void;
  loading: boolean;
}

const CropModal: FC<Props> = ({ isOpen, imageSrc, onCancel, onConfirm, loading }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(1, Math.min(3, newZoom)));
  }, []);

  // Handle keyboard zoom
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomChange(zoom + 0.1);
    } else if (e.key === '-') {
      e.preventDefault();
      handleZoomChange(zoom - 0.1);
    }
  }, [zoom, handleZoomChange]);

  // Add keyboard event listener
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const croppedImageUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      // Immediately show the cropped image - no loading delay
      onConfirm(croppedImageUrl);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  
  if (!isOpen) return null;
  
  return (
    <>
      <style jsx>{`
        .crop-modal {
          --bg: #f7f7f7;
          --card: var(--color-white);
          --text: #111;
          --muted: #666;
          --border: #e9e9e9;
          --btn-bg: rgba(255,255,255,.8);
          --btn-shadow: 0 var(--space-2) var(--space-10) rgba(0,0,0,.08);
          --radius: var(--space-16);
          --primary: #e60023;
          --primary-hover: #ad081b;
        }
        
        .crop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          backdrop-filter: blur(var(--space-4));
        }
        
        .crop-container {
          background: var(--card);
          border: var(--space-1) solid var(--border);
          border-radius: 0;
          overflow: hidden;
          width: auto !important;
          max-width: 90vw !important;
          height: auto !important;
          max-height: 90vh !important;
          display: flex !important;
          flex-direction: column !important;
          min-width: 400px;
          min-height: 300px;
        }
        
        .crop-header {
          padding: var(--space-16) var(--space-32);
          border-bottom: var(--space-1) solid var(--border);
          background: rgba(255, 255, 255, 0.98);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .crop-title {
          font-size: var(--space-18);
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        
        .crop-close {
          background: none;
          border: none;
          font-size: var(--space-18);
          color: #666;
          cursor: pointer;
          padding: var(--space-4);
          border-radius: 50%;
          width: var(--space-32);
          height: var(--space-32);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .crop-close:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }
        
        .crop-area {
          position: relative;
          width: 100% !important;
          height: 400px !important;
          background: var(--bg);
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        
        .crop-controls {
          padding: var(--space-16) var(--space-32);
          border-top: var(--space-1) solid var(--border);
          background: rgba(255, 255, 255, 0.98);
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: var(--space-24);
          flex-direction: column !important;
        }
        
        .crop-actions {
          display: flex;
          gap: var(--space-16);
          align-items: center;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-8);
          border: var(--space-1) solid var(--border);
          background: var(--btn-bg);
          height: var(--space-40);
          padding: 0 var(--space-16);
          border-radius: var(--space-999);
          cursor: pointer;
          box-shadow: var(--btn-shadow);
          backdrop-filter: saturate(1.2) blur(var(--space-2));
          font-weight: 500;
          font-size: var(--space-14);
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .btn:hover {
          transform: translateY(-var(--space-1));
          box-shadow: 0 var(--space-4) var(--space-12) rgba(0, 0, 0, 0.12);
        }
        
        .btn:active {
          transform: translateY(0);
        }
        
        .btn-primary {
          background: #0073aa;
          color: white;
          border-color: #0073aa;
        }
        
        .btn-primary:hover {
          background: #005a87;
          border-color: #005a87;
        }
        
        .btn-primary:disabled {
          background: var(--muted);
          border-color: var(--muted);
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-secondary {
          background: #dc3232;
          color: white;
          border-color: #dc3232;
        }
        
        .btn-secondary:hover {
          background: #b32d2e;
          border-color: #b32d2e;
        }
        
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: var(--space-8);
          color: var(--muted);
          font-size: var(--space-14);
        }
        
        .zoom-slider {
          width: var(--space-200);
          height: var(--space-4);
          background: var(--border);
          border-radius: var(--space-2);
          outline: none;
          cursor: pointer;
        }
        
        .zoom-slider::-webkit-slider-thumb {
          appearance: none;
          width: var(--space-16);
          height: var(--space-16);
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
        }
        
        .zoom-slider::-moz-range-thumb {
          width: var(--space-16);
          height: var(--space-16);
          background: var(--primary);
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
      `}</style>
      
      <div className="crop-overlay">
        <div className="crop-container">
          <div className="crop-header">
            <button className="crop-close" onClick={onCancel} title="Back">
              &lt;
            </button>
            <h2 className="crop-title">Crop Image</h2>
            <div style={{ width: 'var(--space-32)' }}></div>
          </div>
          
          <div className="crop-area">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                minZoom={1}
                maxZoom={3}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={handleZoomChange}
                onCropComplete={handleCropComplete}
                style={{
                  containerStyle: { 
                    backgroundColor: "var(--bg)", 
                    width: "100%", 
                    height: "100%"
                  },
                  cropAreaStyle: { 
                    backgroundColor: "transparent", 
                    border: "var(--space-2) solid var(--primary)",
                    borderRadius: "var(--space-8)"
                  }
                }}
              />
            )}
          </div>
          
          <div className="crop-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
              <label style={{ fontSize: 'var(--space-14)', fontWeight: '500', color: 'var(--text)' }}>
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                className="zoom-slider"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-16)' }}>
              <button
                className="tui-button"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="tui-button"
                onClick={handleConfirm}
                disabled={loading || !croppedAreaPixels}
              >
                {loading ? "Applying…" : "Apply Crop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper function to crop image
const getCroppedImg = (imageSrc: string, croppedAreaPixels: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Use higher quality for better results, but still compressed for faster uploads
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.92); // Increased quality from 0.8 to 0.92 for better visuals
    };
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
};

export default CropModal;
