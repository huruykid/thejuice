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
      
      // Optimized camera constraints for faster initialization
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { min: 320, ideal: 480, max: 640 },
          height: { min: 240, ideal: 360, max: 480 },
          frameRate: { ideal: 15, max: 30 } // Lower framerate for faster startup
        },
        audio: false // Explicitly disable audio for faster initialization
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Multiple event listeners for faster detection
        const handleReady = () => {
          setIsCameraLoading(false);
        };
        
        videoRef.current.onloadedmetadata = handleReady;
        videoRef.current.oncanplay = handleReady;
        
        // Fallback timeout to prevent infinite loading
        setTimeout(() => {
          if (isCameraLoading) {
            setIsCameraLoading(false);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsCameraLoading(false);
      setCameraError('Camera access denied. You can upload a photo instead.');
      setRetryCount(prev => prev + 1);
    }
  };

  const checkImageQuality = (imageData: string): Promise<'good' | 'poor'> => {
    return new Promise((resolve) => {
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
        if (!data) return resolve('good');
        
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

    // Optimized JPEG quality for smaller file size and faster upload
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageDataUrl);

    // Always assume good quality initially for instant feedback
    setImageQuality('good');
    
    // Optional: Quick quality check in background (non-blocking)
    setTimeout(() => {
      checkImageQuality(imageDataUrl).then(quality => {
        if (quality === 'poor') {
          setImageQuality(quality);
          setShowQualityTips(true);
        }
      });
    }, 100); // Delay to not block UI

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
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setCapturedImage(imageDataUrl);
      
      // Set quality to good by default, check in background
      setImageQuality('good');
      
      // Check quality asynchronously
      checkImageQuality(imageDataUrl).then(quality => {
        setImageQuality(quality);
      });
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setImageQuality('good'); // Default to good for instant feedback
    setShowQualityTips(false);
    setIsCameraLoading(true);
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
                    <div className="text-center p-6 space-y-3">
                      <div className="relative">
                        <Camera className="h-12 w-12 mx-auto text-primary/60" />
                        <div className="absolute inset-0 animate-pulse">
                          <Camera className="h-12 w-12 mx-auto text-primary/40" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-medium text-sm">Camera loading...</p>
                        <p className="text-white/70 text-xs">Almost ready!</p>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
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