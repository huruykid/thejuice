import React, { useRef, useState, useEffect } from 'react';
import { Camera, RotateCcw, Check, Upload, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import OnboardingTips from '@/components/OnboardingTips';
import { cn } from '@/lib/utils';

interface EnhancedSelfieCaptureProps {
  onComplete: (success: boolean) => void;
  userId: string;
}

const EnhancedSelfieCapture: React.FC<EnhancedSelfieCaptureProps> = ({ onComplete, userId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [imageQuality, setImageQuality] = useState<'good' | 'poor' | 'checking'>('checking');
  const [showQualityTips, setShowQualityTips] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);

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
      setIsCameraLoading(true);
      setCameraError(null);
      
      // Show user what's happening
      toast({
        title: "📷 Starting camera...",
        description: "Please wait while we access your camera",
      });
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready before hiding loading
        videoRef.current.onloadedmetadata = () => {
          setIsCameraLoading(false);
          toast({
            title: "✅ Camera ready!",
            description: "Position your face in the frame and take a clear photo",
          });
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsCameraLoading(false);
      setCameraError('Camera access denied. You can upload a photo instead.');
      setRetryCount(prev => prev + 1);
      
      toast({
        title: "Camera access denied",
        description: "No worries! You can upload a photo instead.",
        variant: "destructive",
      });
    }
  };

  const checkImageQuality = (imageData: string): Promise<'good' | 'poor'> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const data = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!data) return resolve('poor');
        
        let totalBrightness = 0;
        let minBrightness = 255;
        let maxBrightness = 0;
        
        for (let i = 0; i < data.data.length; i += 4) {
          const r = data.data[i];
          const g = data.data[i + 1];
          const b = data.data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          minBrightness = Math.min(minBrightness, brightness);
          maxBrightness = Math.max(maxBrightness, brightness);
        }
        
        const avgBrightness = totalBrightness / (data.data.length / 4);
        const contrast = maxBrightness - minBrightness;
        
        // More strict quality check: good brightness range, sufficient contrast, not too dark/bright
        const isGoodQuality = avgBrightness > 60 && avgBrightness < 180 && contrast > 50;
        resolve(isGoodQuality ? 'good' : 'poor');
      };
      img.src = imageData;
    });
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);

    // Check image quality
    setImageQuality('checking');
    const quality = await checkImageQuality(imageDataUrl);
    setImageQuality(quality);
    
    if (quality === 'poor') {
      setShowQualityTips(true);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result as string;
      setCapturedImage(imageDataUrl);
      
      setImageQuality('checking');
      const quality = await checkImageQuality(imageDataUrl);
      setImageQuality(quality);
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImageQuality('checking');
    setShowQualityTips(false);
    setIsCameraLoading(true); // Show loading when restarting camera
    startCamera();
  };

  const uploadAndSave = async () => {
    if (!capturedImage || isLoading) return;

    // Prevent upload of poor quality images
    if (imageQuality === 'poor') {
      toast({
        title: "Photo Quality Too Low",
        description: "Please take a clearer photo with better lighting before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Show immediate feedback to user
    toast({
      title: "Uploading selfie...",
      description: "Hang tight 👀 This might take a few seconds.",
    });
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const fileName = `${userId}/${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-selfies')
        .getPublicUrl(fileName);

      // Use the createVerification mutation from useVerification
      const { error: dbError } = await supabase
        .from('user_verifications')
        .upsert({
          user_id: userId,
          selfie_url: publicUrl,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      toast({
        title: "✨ Photo Submitted Successfully!",
        description: "Next, please review our community guidelines.",
      });

      onComplete(true);
    } catch (error) {
      console.error('Error uploading selfie:', error);
      toast({
        title: "Upload Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (cameraError && retryCount >= 2) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Upload className="h-16 w-16 mx-auto text-primary" />
            <CardTitle className="text-xl">Upload a Photo Instead</CardTitle>
            <CardDescription>
              No worries! You can upload a clear selfie from your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {capturedImage ? (
              <div className="space-y-4">
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Uploaded selfie"
                    className="w-full h-full object-cover"
                  />
                  {imageQuality === 'poor' && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Could be clearer
                    </div>
                  )}
                </div>
                
                {showQualityTips && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">Photo Tips:</p>
                        <ul className="text-amber-700 dark:text-amber-300 mt-1 text-xs space-y-1">
                          <li>• Make sure you're in good lighting</li>
                          <li>• Face the camera directly</li>
                          <li>• Remove sunglasses or hats</li>
                          <li>• Keep the image clear and sharp</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Different
                  </Button>
                  <Button 
                    onClick={uploadAndSave} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Uploading...
                      </div>
                    ) : (
                      "Submit Photo"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Photo
              </Button>
            )}
            
            <div className="text-center">
              <Button 
                onClick={startCamera} 
                variant="ghost" 
                size="sm"
                className="text-primary"
              >
                Or try camera again
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
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            {!capturedImage ? (
              <>
                {cameraError ? (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <div className="text-center p-4">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">{cameraError}</p>
                    </div>
                  </div>
                ) : isCameraLoading ? (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-primary/10">
                    <div className="text-center p-6 space-y-4">
                      <div className="relative">
                        <Camera className="h-16 w-16 mx-auto text-primary/60" />
                        <div className="absolute inset-0 animate-ping">
                          <Camera className="h-16 w-16 mx-auto text-primary/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-medium">Starting camera...</p>
                        <p className="text-white/80 text-sm">This may take a few seconds</p>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}
                
                {!isCameraLoading && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 border-2 border-white/30 rounded-2xl"></div>
                  </div>
                )}
              </>
            ) : (
              <div className="relative h-full">
                <img
                  src={capturedImage}
                  alt="Captured selfie"
                  className="w-full h-full object-cover"
                />
                {imageQuality === 'checking' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-sm">Checking quality...</div>
                  </div>
                )}
                {imageQuality === 'good' && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Good quality
                  </div>
                )}
                {imageQuality === 'poor' && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Could be clearer
                  </div>
                )}
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-3">
            {!capturedImage ? (
              <>
                <Button 
                  onClick={capturePhoto} 
                  disabled={!stream || !!cameraError || isCameraLoading}
                  className="flex-1"
                  size="lg"
                >
                  {isCameraLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                      Camera Starting...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </>
                  )}
                </Button>
                {cameraError && (
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="lg"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  onClick={retakePhoto} 
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button 
                  onClick={uploadAndSave} 
                  disabled={isLoading}
                  className={cn(
                    "flex-1",
                    imageQuality === 'good' && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {showQualityTips && imageQuality === 'poor' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">For best results:</p>
                  <ul className="text-amber-700 dark:text-amber-300 mt-1 text-xs space-y-1">
                    <li>• Move to better lighting</li>
                    <li>• Hold camera steady</li>
                    <li>• Make sure face fills the frame</li>
                    <li>• Clean camera lens if blurry</li>
                  </ul>
                </div>
              </div>
            </div>
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

export default EnhancedSelfieCapture;