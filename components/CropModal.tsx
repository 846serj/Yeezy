"use client";
import { FC, useState, useCallback } from "react";
import Cropper from "react-easy-crop";

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

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const croppedImageUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(croppedImageUrl);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  console.log('🎬 CropModal render:', { 
    isOpen, 
    imageSrc: imageSrc ? 'has image' : 'no image', 
    loading,
    imageUrl: imageSrc
  });
  
  if (!isOpen) return null;
  
  return (
    <>
      <style jsx>{`
        .crop-modal {
          --bg: #f7f7f7;
          --card: #ffffff;
          --text: #111;
          --muted: #666;
          --border: #e9e9e9;
          --btn-bg: rgba(255,255,255,.8);
          --btn-shadow: 0 2px 10px rgba(0,0,0,.08);
          --radius: 16px;
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
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        
        .crop-container {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          max-width: 1000px;
          width: 100%;
          max-height: 90vh;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
        }
        
        .crop-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--card);
        }
        
        .crop-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        
        .crop-close {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .crop-close:hover {
          background: var(--bg);
          color: var(--text);
        }
        
        .crop-area {
          position: relative;
          width: 100%;
          height: 500px;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .crop-controls {
          padding: 16px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: var(--card);
        }
        
        .crop-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid var(--border);
          background: var(--btn-bg);
          height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: var(--btn-shadow);
          backdrop-filter: saturate(1.2) blur(2px);
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        
        .btn:active {
          transform: translateY(0);
        }
        
        .btn-primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        
        .btn-primary:hover {
          background: var(--primary-hover);
          border-color: var(--primary-hover);
        }
        
        .btn-primary:disabled {
          background: var(--muted);
          border-color: var(--muted);
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-secondary {
          background: var(--btn-bg);
          color: var(--text);
        }
        
        .btn-secondary:hover {
          background: var(--bg);
        }
        
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 14px;
        }
        
        .zoom-slider {
          width: 100px;
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        
        .zoom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
        }
        
        .zoom-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: var(--primary);
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
      `}</style>
      
      <div className="crop-overlay">
        <div className="crop-container">
          <div className="crop-header">
            <h2 className="crop-title">Crop Image</h2>
            <button className="crop-close" onClick={onCancel} title="Close">
              ×
            </button>
          </div>
          
          <div className="crop-area">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1280 / 720}
                minZoom={1}
                maxZoom={3}
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                style={{
                  containerStyle: { 
                    backgroundColor: "var(--bg)", 
                    width: "100%", 
                    height: "100%",
                    borderRadius: "0"
                  },
                  cropAreaStyle: { 
                    backgroundColor: "transparent", 
                    border: "2px solid var(--primary)",
                    borderRadius: "8px"
                  },
                }}
              />
            )}
          </div>
          
          <div className="crop-controls">
            <div className="zoom-controls">
              <span>Zoom:</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="zoom-slider"
              />
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            
            <div className="crop-actions">
              <button
                onClick={onCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="btn btn-primary"
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

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.8);
    };
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
};

export default CropModal;
