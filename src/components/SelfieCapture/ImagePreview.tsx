import { Check, AlertTriangle, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ImageQuality } from '@/hooks/useImageProcessing';

interface ImagePreviewProps {
  imageData: string;
  quality: ImageQuality;
  showQualityTips: boolean;
  isUploading: boolean;
  onRetake: () => void;
  onSubmit: () => void;
}

export const ImagePreview = ({
  imageData,
  quality,
  showQualityTips,
  isUploading,
  onRetake,
  onSubmit
}: ImagePreviewProps) => {
  return (
    <>
      <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
        <img
          src={imageData}
          alt="Captured selfie"
          className="w-full h-full object-cover"
        />
        {quality === 'checking' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm">Checking quality...</div>
          </div>
        )}
        {quality === 'good' && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Check className="h-3 w-3" />
            Good quality
          </div>
        )}
        {quality === 'poor' && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Could be clearer
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={onRetake} 
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Retake
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isUploading}
          className={cn(
            "flex-1",
            quality === 'good' && "bg-green-600 hover:bg-green-700"
          )}
        >
          {isUploading ? (
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
      </div>

      {showQualityTips && quality === 'poor' && (
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
    </>
  );
};