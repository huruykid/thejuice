import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useCreateStory } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PersonDetailsStep from "./PersonDetailsStep";
import StoryContentStep from "./StoryContentStep";
import MetadataStep from "./MetadataStep";
import SuccessAnimation from "./SuccessAnimation";

export interface StoryData {
  content: string;
  selectedTags: string[];
  metadata: {
    city_id: string | null;
  };
  personName: string;
  personPhone: string;
}

const CreateStory = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [storyData, setStoryData] = useState<StoryData>({
    content: '',
    selectedTags: [],
    metadata: {
      city_id: null,
    },
    personName: '',
    personPhone: '',
  });

  const createStory = useCreateStory();
  const { toast } = useToast();

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive"
        });
        return null;
      }

      const { data } = supabase.storage
        .from('story-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
      return null;
    }
  };

  const handlePublish = async () => {
    try {
      let imageUrls: string[] = [];

      if (uploadedImages.length > 0) {
        setUploading(true);
        for (const image of uploadedImages) {
          const url = await uploadImageToStorage(image);
          if (url) {
            imageUrls.push(url);
          }
        }
        setUploading(false);
      }
      
      const storyPayload = {
        content: storyData.content,
        tags: storyData.selectedTags,
        city_id: storyData.metadata.city_id,
        imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
        subjectName: storyData.personName,
        subjectPhone: storyData.personPhone
      };
      
      await createStory.mutateAsync(storyPayload);

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error: any) {
      console.error('Error publishing story:', error);
      
      let errorMessage = "Failed to publish story. Please try again.";
      
      if (error?.message?.includes('verification')) {
        errorMessage = "You need to complete account verification before posting stories.";
      } else if (error?.message?.includes('Invalid story content')) {
        errorMessage = "Story content contains invalid characters or formatting.";
      } else if (error?.message?.includes('Invalid subject phone')) {
        errorMessage = "Please enter a valid phone number format.";
      } else if (error?.message?.includes('authentication')) {
        errorMessage = "Please log in to post a story.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  if (showSuccess) {
    return <SuccessAnimation />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-juice-blue/10">
          <h2 className="text-xl font-bold text-foreground">Share Your Story</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 0 && (
            <PersonDetailsStep
              storyData={storyData}
              setStoryData={setStoryData}
              uploadedImages={uploadedImages}
              setUploadedImages={setUploadedImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              onNext={handleNext}
              onClose={onClose}
            />
          )}

          {step === 1 && (
            <StoryContentStep
              storyData={storyData}
              setStoryData={setStoryData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {step === 2 && (
            <MetadataStep
              storyData={storyData}
              setStoryData={setStoryData}
              onPublish={handlePublish}
              onBack={handleBack}
              isLoading={createStory.isPending || uploading}
              uploading={uploading}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateStory;