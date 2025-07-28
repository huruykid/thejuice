import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoading: boolean;
  error: string | null;
  hasStream: boolean;
  onCapture: () => void;
  onUpload: () => void;
  onSkipCamera: () => void;
}

export const CameraView = ({
  videoRef,
  isLoading,
  error,
  hasStream,
  onCapture,
  onUpload,
  onSkipCamera
}: CameraViewProps) => {
  return (
    <>
      <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center p-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : isLoading ? (
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
        
        {!isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-64 border-2 border-white/30 rounded-2xl"></div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onCapture} 
          disabled={!hasStream || !!error || isLoading}
          className="flex-1"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
              Starting Camera...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </>
          )}
        </Button>
        
        {/* Always show upload option */}
        <Button 
          onClick={onUpload}
          variant="outline"
          size="lg"
          className="px-3"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {/* Skip option for camera issues */}
      {isLoading && (
        <div className="text-center">
          <Button 
            onClick={onSkipCamera}
            variant="ghost" 
            size="sm"
            className="text-muted-foreground"
          >
            Camera taking too long? Upload photo instead
          </Button>
        </div>
      )}
    </>
  );
};