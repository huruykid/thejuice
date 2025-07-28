import { Upload, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImageQuality } from '@/hooks/useImageProcessing';

interface UploadFallbackProps {
  capturedImage: string | null;
  quality: ImageQuality;
  showQualityTips: boolean;
  isUploading: boolean;
  onFileSelect: () => void;
  onSubmit: () => void;
  onTryCamera: () => void;
}

export const UploadFallback = ({
  capturedImage,
  quality,
  showQualityTips,
  isUploading,
  onFileSelect,
  onSubmit,
  onTryCamera
}: UploadFallbackProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Upload className="h-16 w-16 mx-auto text-primary" />
        <CardTitle className="text-xl">Upload a Photo Instead</CardTitle>
        <CardDescription>
          No worries! You can upload a clear selfie from your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {capturedImage ? (
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Uploaded selfie"
                className="w-full h-full object-cover"
              />
              {quality === 'poor' && (
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
              <Button onClick={onFileSelect} variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Choose Different
              </Button>
              <Button 
                onClick={onSubmit} 
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
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
            onClick={onFileSelect} 
            className="w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Photo
          </Button>
        )}
        
        <div className="text-center">
          <Button 
            onClick={onTryCamera} 
            variant="ghost" 
            size="sm"
            className="text-primary"
          >
            Or try camera again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};