import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { useVerificationUpload } from '@/hooks/useVerificationUpload';
import { CameraView } from '@/components/SelfieCapture/CameraView';
import { ImagePreview } from '@/components/SelfieCapture/ImagePreview';
import { UploadFallback } from '@/components/SelfieCapture/UploadFallback';
import OnboardingTips from '@/components/OnboardingTips';

interface RefactoredSelfieCaptureProps {
  onComplete: (success: boolean) => void;
  userId: string;
}

const RefactoredSelfieCapture: React.FC<RefactoredSelfieCaptureProps> = ({ onComplete, userId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const { 
    videoRef, 
    stream, 
    isLoading: isCameraLoading, 
    error: cameraError, 
    retryCount,
    capturePhoto,
    stopCamera,
    skipCamera,
    startCamera
  } = useCameraCapture();
  
  const { 
    quality, 
    showQualityTips, 
    checkQualityAsync, 
    resetQuality 
  } = useImageProcessing();
  
  const { 
    isUploading, 
    uploadVerification, 
    validateFile 
  } = useVerificationUpload();

  const handleCapture = () => {
    const imageData = capturePhoto();
    if (imageData) {
      setCapturedImage(imageData);
      checkQualityAsync(imageData);
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setCapturedImage(imageDataUrl);
      checkQualityAsync(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    resetQuality();
    startCamera();
  };

  const handleSubmit = async () => {
    if (!capturedImage) return;
    
    const success = await uploadVerification(capturedImage, userId, quality);
    onComplete(success);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Show upload fallback if camera failed after retries
  if (cameraError && retryCount >= 2) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <UploadFallback
          capturedImage={capturedImage}
          quality={quality}
          showQualityTips={showQualityTips}
          isUploading={isUploading}
          onFileSelect={handleFileSelect}
          onSubmit={handleSubmit}
          onTryCamera={startCamera}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
            <CardDescription>
              Take a clear selfie to verify you're a real person and keep our community safe.
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
            <CameraView
              videoRef={videoRef}
              isLoading={isCameraLoading}
              error={cameraError}
              hasStream={!!stream}
              onCapture={handleCapture}
              onUpload={handleFileSelect}
              onSkipCamera={skipCamera}
            />
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Your photo is stored securely and used only for verification.
            </p>
          </div>
          
          <OnboardingTips step="selfie" />
        </CardContent>
      </Card>
    </div>
  );
};

export default RefactoredSelfieCapture;