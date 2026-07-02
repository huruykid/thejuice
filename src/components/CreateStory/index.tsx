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
    location?: string;
    city_id?: string | null;
  };
  personName: string;
  personPhone: string;
  /** The single green/red verdict: +1 juice, -1 milk, 0 none. */
  verdict: number;
}

const CreateStory = ({
  onClose,
  isUnverified = false,
}: {
  onClose: () => void;
  isUnverified?: boolean;
}) => {
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [storyData, setStoryData] = useState<StoryData>({
    content: '',
    selectedTags: [],
    metadata: {
      location: '',
      city_id: null,
    },
    personName: '',
    personPhone: '',
    verdict: 0,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be signed in to upload photos.",
          variant: "destructive"
        });
        return null;
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      // RLS on story-images requires the first folder segment to equal auth.uid()
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Error",
          description: `Failed to upload image: ${uploadError.message}`,
          variant: "destructive"
        });
        return null;
      }

      // Store the object PATH (not a public URL). The bucket is private; images
      // are resolved to short-lived signed URLs at render time via
      // useStoryImageUrls. Returning the path keeps story PII photos off public URLs.
      return filePath;
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
          if (url === null) {
            // One image failed — abort the whole submission so the user knows
            // exactly what happened rather than silently dropping the photo.
            setUploading(false);
            toast({
              title: "Upload failed",
              description: "One or more photos could not be uploaded. Please try again.",
              variant: "destructive",
            });
            return;
          }
          imageUrls.push(url);
        }
        setUploading(false);
      }

      if (imageUrls.length === 0) {
        toast({
          title: "Photo required",
          description: "At least one photo is required to publish a story.",
          variant: "destructive"
        });
        return;
      }

      const storyPayload = {
        content: storyData.content,
        tags: storyData.selectedTags,
        city_id: storyData.metadata.city_id ?? null,
        location: storyData.metadata.location?.trim() || null,
        imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
        subjectName: storyData.personName,
        subjectPhone: storyData.personPhone,
        verdict: storyData.verdict,
      };
      
      await createStory.mutateAsync(storyPayload);

      // Reset form state so re-opening the modal starts fresh.
      setStoryData({
        content: '',
        selectedTags: [],
        metadata: { location: '', city_id: null },
        personName: '',
        personPhone: '',
        verdict: 0,
      });
      setUploadedImages([]);
      setImagePreviews([]);
      setStep(0);

      setShowSuccess(true);
      if (isUnverified) {
        toast({
          title: "Submitted!",
          description:
            "An admin will review it before it goes live. Verify your account to read everyone else's stories.",
        });
      }
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
      <Card className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <h2 className="text-xl font-bold text-foreground">Share the Juice</h2>
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