"use client";
import React, { FC, useState, useCallback } from "react";
import { createPortal } from "react-dom";
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

  // Reset crop state when image changes
  React.useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [imageSrc]);


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

  if (!isOpen) {
    return null;
  }
  
  // Use portal to render modal at document body level
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="bg-black p-2 w-[98vw] max-w-[1400px] flex flex-col items-center"
        style={{
          backgroundColor: 'black',
          padding: '8px',
          width: '98vw',
          maxWidth: '1400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1000000
        }}
      >
        <div 
          className="relative w-full h-[55.125vw] max-h-[787.5px]"
          style={{
            position: 'relative',
            width: '100%',
            height: '55.125vw',
            maxHeight: '787.5px',
            backgroundColor: '#000'
          }}
        >
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
                  backgroundColor: "#000", 
                  width: "100%", 
                  height: "100%",
                  position: 'relative'
                },
                cropAreaStyle: { backgroundColor: "transparent", border: "none" },
              }}
            />
          )}
        </div>
        <div className="mt-4 flex" style={{ gap: '20px' }}>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-white rounded disabled:opacity-50"
            style={{ backgroundColor: 'var(--tui-success)', border: 'none' }}
          >
            {loading ? "Applying…" : "Apply Crop"}
          </button>
        </div>
      </div>
    </div>,
    document.body
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
