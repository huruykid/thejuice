import { useState, useRef, useEffect } from 'react';

export interface CameraState {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export const useCameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      // Simplified constraints for better compatibility
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        let isReady = false;
        
        // Single handler to prevent multiple calls
        const handleVideoReady = () => {
          if (isReady) return; // Prevent multiple calls
          isReady = true;
          console.log('Camera ready - video can play');
          setIsLoading(false);
        };
        
        const handleError = (e: Event) => {
          console.error('Video error occurred:', e);
          setIsLoading(false);
          setError('Camera failed to start. You can upload a photo instead.');
        };
        
        // Aggressive timeout - if not ready in 1.5 seconds, assume it's working
        const timeoutId = setTimeout(() => {
          if (!isReady) {
            console.log('Camera timeout - forcing ready state after 1.5s');
            isReady = true;
            setIsLoading(false);
          }
        }, 1500); // Even more aggressive
        
        // Try multiple approaches for detecting ready state
        const video = videoRef.current;
        
        // Approach 1: Standard events
        video.addEventListener('loadedmetadata', handleVideoReady, { once: true });
        video.addEventListener('canplay', handleVideoReady, { once: true });
        video.addEventListener('error', handleError, { once: true });
        
        // Approach 2: Check if video dimensions are available (immediate)
        const checkDimensions = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            handleVideoReady();
          }
        };
        checkDimensions();
        
        // Approach 3: Polling fallback
        const pollInterval = setInterval(() => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            clearInterval(pollInterval);
            handleVideoReady();
          }
        }, 100);
        
        // Cleanup function
        setTimeout(() => {
          clearTimeout(timeoutId);
          clearInterval(pollInterval);
        }, 5000);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setIsLoading(false);
      
      // More specific error messages
      let errorMessage = 'Camera access denied. You can upload a photo instead.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access or upload a photo.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. You can upload a photo instead.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Please upload a photo.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another app. Please close other apps or upload a photo.';
      }
      
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    }
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !stream) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Optimized JPEG quality for smaller file size and faster upload
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const skipCamera = () => {
    setIsLoading(false);
    setError('Camera unavailable. Please upload a photo instead.');
  };

  return {
    videoRef,
    stream,
    isLoading,
    error,
    retryCount,
    startCamera,
    capturePhoto,
    stopCamera,
    skipCamera
  };
};