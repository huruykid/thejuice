import { useState } from 'react';

export interface CameraState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export const useCameraCapture = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const captureDirectPhoto = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      
      // Get camera stream for single photo capture
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      
      // Create video element for capture
      const video = document.createElement('video');
      video.srcObject = mediaStream;
      video.muted = true;
      video.playsInline = true;
      
      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          video.play().then(() => {
            // Wait a moment for the camera to adjust
            setTimeout(() => {
              // Create canvas and capture
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              
              if (!context) {
                mediaStream.getTracks().forEach(track => track.stop());
                resolve(null);
                return;
              }
              
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Stop the camera
              mediaStream.getTracks().forEach(track => track.stop());
              
              // Convert to base64
              const photoData = canvas.toDataURL('image/jpeg', 0.85);
              
              setIsLoading(false);
              resolve(photoData);
            }, 500); // Brief delay for camera to stabilize
          });
        });
        
        video.addEventListener('error', () => {
          mediaStream.getTracks().forEach(track => track.stop());
          setIsLoading(false);
          setError('Failed to capture photo');
          resolve(null);
        });
      });
      
    } catch (error: any) {
      console.error('Error capturing photo:', error);
      setIsLoading(false);
      
      // More specific error messages
      let errorMessage = 'Camera access denied. Please allow camera access.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      }
      
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      return null;
    }
  };


  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    retryCount,
    captureDirectPhoto,
    clearError
  };
};