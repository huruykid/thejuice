import React, { useRef, useState, useEffect } from 'react';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import OnboardingTips from '@/components/OnboardingTips';

interface SelfieCaptureProps {
  onComplete: (success: boolean) => void;
  userId: string;
}

const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onComplete, userId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front-facing camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Camera access denied. Please allow camera access to continue.');
      toast({
        title: "Camera Access Required",
        description: "This app requires camera access for verification. Please allow camera permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);

    // Stop the camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const uploadAndSave = async () => {
    if (!capturedImage) return;

    setIsLoading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create filename with user ID and timestamp
      const fileName = `${userId}/${Date.now()}.jpg`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-selfies')
        .getPublicUrl(fileName);

      // Save verification record
      const { error: dbError } = await supabase
        .from('user_verifications')
        .insert({
          user_id: userId,
          selfie_url: publicUrl,
          verification_status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: "Verification Submitted",
        description: "Please review the community guidelines next, then your account will be pending approval.",
      });

      onComplete(true);
    } catch (error) {
      console.error('Error uploading selfie:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const skipVerification = () => {
    toast({
      title: "Verification Required",
      description: "Selfie verification is required to access this platform.",
      variant: "destructive",
    });
  };

  if (cameraError) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Camera Access Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {cameraError}
              </p>
            </div>
            <Button onClick={startCamera} className="w-full">
              Try Again
            </Button>
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
            <CardDescription className="text-muted-foreground">
              Take a selfie to verify you're a real person. This helps us keep the community safe and authentic.
            </CardDescription>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <p><strong>Photo Tips:</strong> Make sure your face is clearly visible, well-lit, and looking at the camera</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // Mirror effect
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Camera guidelines overlay */}
            {!capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-64 border-2 border-white/30 rounded-2xl"></div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-3">
            {!capturedImage ? (
              <Button 
                onClick={capturePhoto} 
                disabled={!stream}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
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
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    "Uploading..."
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

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Your photo will be stored securely and used only for verification purposes.
            </p>
          </div>
          
          <OnboardingTips step="selfie" />
        </CardContent>
      </Card>
    </div>
  );
};

export default SelfieCapture;