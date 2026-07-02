import React, { useState } from 'react';
import BrandLockup from '@/components/BrandLockup';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useVerificationUpload } from '@/hooks/useVerificationUpload';
import { useOnboardingState } from '@/hooks/useOnboardingState';

import { ImagePreview } from '@/components/SelfieCapture/ImagePreview';
import OnboardingTips from '@/components/OnboardingTips';

interface RefactoredSelfieCaptureProps {
  onComplete: (success: boolean) => void;
  userId: string;
}

const RefactoredSelfieCapture: React.FC<RefactoredSelfieCaptureProps> = ({ onComplete, userId }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { clearState } = useOnboardingState(userId);
  
  const { 
    captureDirectPhoto, 
    isLoading: isCameraLoading, 
    error: cameraError, 
    retryCount,
    clearError
  } = useCameraCapture();
  
  const { 
    quality, 
    showQualityTips, 
    checkQualityAsync, 
    resetQuality 
  } = useImageProcessing();
  
  const { 
    isUploading, 
    uploadVerification
  } = useVerificationUpload();

  const handleCapture = async () => {
    const imageData = await captureDirectPhoto();
    if (imageData) {
      setCapturedImage(imageData);
      checkQualityAsync(imageData);
    }
  };


  const handleRetake = () => {
    setCapturedImage(null);
    resetQuality();
  };

  const handleSubmit = async () => {
    if (!capturedImage) return;
    
    const success = await uploadVerification(capturedImage, userId, quality);
    onComplete(success);
  };

  const handleStartOver = () => {
    clearState();
    navigate('/');
  };

  const handleCancel = () => {
    clearState();
    navigate('/');
  };


  // If camera fails, show error message and retry option
  if (cameraError && retryCount >= 2) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <BrandLockup variant="mark" size="lg" className="mx-auto" />
            <div>
              <CardTitle className="text-2xl font-bold">Camera Required</CardTitle>
              <CardDescription>
                We need you to take a live selfie for verification. Please enable camera access to continue.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-muted rounded-lg">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-2">Camera Access Required</p>
              <p className="text-xs text-muted-foreground mb-4">{cameraError}</p>
              <Button onClick={handleCapture} disabled={isCameraLoading} className="w-full">
                Try Camera Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <BrandLockup variant="mark" size="lg" className="mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold">Verify you're a real man</CardTitle>
            <CardDescription>
              Juice is a verified-men-only community. A real person reviews every
              selfie — accounts that aren't eligible aren't approved.
            </CardDescription>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <Camera className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-primary">Photo Guidelines:</p>
                <ul className="text-muted-foreground mt-1 text-xs space-y-1">
                  <li>• Face clearly visible and well-lit</li>
                  <li>• Look directly at camera</li>
                  <li>• No sunglasses or face coverings</li>
                  <li>• Photo should be sharp and clear</li>
                </ul>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!capturedImage ? (
            <div className="text-center p-8 bg-muted rounded-lg">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-4">Ready to take your verification photo</p>
              <Button 
                onClick={handleCapture} 
                disabled={isCameraLoading}
                className="w-full h-12 text-lg"
              >
                {isCameraLoading ? 'Taking Photo...' : 'Take Selfie'}
              </Button>
              {cameraError && (
                <p className="text-sm text-destructive mt-2">{cameraError}</p>
              )}
            </div>
          ) : (
            <ImagePreview
              imageData={capturedImage}
              quality={quality}
              showQualityTips={showQualityTips}
              isUploading={isUploading}
              onRetake={handleRetake}
              onSubmit={handleSubmit}
            />
          )}


          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Your photo is stored securely and used only for verification.
            </p>
          </div>
          
          <OnboardingTips step="selfie" />
          
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleStartOver}
              className="flex-1"
            >
              Start Over
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel Sign-up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefactoredSelfieCapture;