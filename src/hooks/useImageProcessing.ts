import { useState } from 'react';

export type ImageQuality = 'good' | 'poor' | 'checking';

export const useImageProcessing = () => {
  const [quality, setQuality] = useState<ImageQuality>('good');
  const [showQualityTips, setShowQualityTips] = useState(false);

  const checkImageQuality = (imageData: string): Promise<ImageQuality> => {
    return new Promise((resolve) => {
      setQuality('checking');
      
      // Ultra-fast quality check using minimal sampling
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Super small sample for instant checking
        const sampleSize = 32;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        
        // Quick center crop
        const centerX = img.width / 2 - sampleSize / 2;
        const centerY = img.height / 2 - sampleSize / 2;
        ctx?.drawImage(img, centerX, centerY, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
        
        const data = ctx?.getImageData(0, 0, sampleSize, sampleSize);
        if (!data) {
          const result: ImageQuality = 'good';
          setQuality(result);
          return resolve(result);
        }
        
        // Sample every 8th pixel for maximum speed
        let totalBrightness = 0;
        const sampleCount = data.data.length / 32; // Much fewer samples
        
        for (let i = 0; i < data.data.length; i += 32) {
          const r = data.data[i];
          const g = data.data[i + 1];
          const b = data.data[i + 2];
          totalBrightness += (r + g + b) / 3;
        }
        
        const avgBrightness = totalBrightness / sampleCount;
        
        // More lenient quality check for better UX
        const isGoodQuality = avgBrightness > 30 && avgBrightness < 220;
        const result: ImageQuality = isGoodQuality ? 'good' : 'poor';
        
        setQuality(result);
        
        if (result === 'poor') {
          setShowQualityTips(true);
        }
        
        resolve(result);
      };
      img.src = imageData;
    });
  };

  const checkQualityAsync = (imageData: string) => {
    // Always assume good quality initially for instant feedback
    setQuality('good');
    setShowQualityTips(false);
    
    // Optional: Quick quality check in background (non-blocking)
    setTimeout(() => {
      checkImageQuality(imageData);
    }, 100); // Delay to not block UI
  };

  const resetQuality = () => {
    setQuality('good');
    setShowQualityTips(false);
  };

  return {
    quality,
    showQualityTips,
    checkImageQuality,
    checkQualityAsync,
    resetQuality
  };
};