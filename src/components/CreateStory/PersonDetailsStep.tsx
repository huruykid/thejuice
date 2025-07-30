import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StoryData } from "./index";

interface PersonDetailsStepProps {
  storyData: StoryData;
  setStoryData: (updater: (prev: StoryData) => StoryData) => void;
  uploadedImages: File[];
  setUploadedImages: (updater: (prev: File[]) => File[]) => void;
  imagePreviews: string[];
  setImagePreviews: (updater: (prev: string[]) => string[]) => void;
  onNext: () => void;
  onClose: () => void;
}

const PersonDetailsStep = ({
  storyData,
  setStoryData,
  uploadedImages,
  setUploadedImages,
  imagePreviews,
  setImagePreviews,
  onNext,
  onClose
}: PersonDetailsStepProps) => {
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    if (uploadedImages.length + newFiles.length > 5) {
      toast({
        title: "Error",
        description: "You can only upload up to 5 photos",
        variant: "destructive"
      });
      return;
    }

    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `${file.name} must be less than 5MB`,
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        return;
      }
    }

    setUploadedImages(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Person Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name/Username *</label>
            <Input
              value={storyData.personName}
              onChange={(e) => setStoryData(prev => ({ ...prev, personName: e.target.value }))}
              placeholder="@username or first name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <Input
              value={storyData.personPhone}
              onChange={(e) => setStoryData(prev => ({ ...prev, personPhone: e.target.value }))}
              placeholder="Phone number"
              type="tel"
              required
            />
            <p className="text-xs text-gray-500 mt-1">For profile matching only - never displayed publicly</p>
          </div>

          {/* Add Photos Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Add Photos (Optional)</h4>
            
            {imagePreviews.length === 0 ? (
              <div className="border-2 border-dashed border-juice-blue/30 rounded-lg p-6 text-center hover:border-juice-blue/50 transition-smooth">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Upload photos</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB each (max 5 photos)</p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Story preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-white/80 hover:bg-white"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {imagePreviews.length < 5 && (
                  <div className="border-2 border-dashed border-juice-blue/30 rounded-lg p-4 text-center hover:border-juice-blue/50 transition-smooth">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload-more"
                    />
                    <label htmlFor="image-upload-more" className="cursor-pointer flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Add more photos ({imagePreviews.length}/5)</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={onNext}
          disabled={!storyData.personName.trim() || !storyData.personPhone.trim()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PersonDetailsStep;