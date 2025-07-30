import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles, Camera, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCreateStory } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CreateStory = ({
  onClose
}: {
  onClose: () => void;
}) => {
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [storyData, setStoryData] = useState({
    content: '',
    selectedTags: [] as string[],
    metadata: {
      city: '',
      ageRange: '',
      datingApp: '',
      relationshipStage: '',
    },
    personName: '',
    personPhone: '',
  });

  const createStory = useCreateStory();
  const { toast } = useToast();

  const greenFlags = [
    "💯Loyal", "✨Thoughtful", "🔥Chemistry", "🎵Music Lover", "🍕Foodie", 
    "💼Career Focused", "🏃‍♂️Active", "🎨Creative", "😂Funny", "🧠Smart",
    "💝Generous", "🤗Respectful", "📞Good Communicator"
  ];

  const redFlags = [
    "🚩Red Flag", "🫠Ghosted", "💸Gold Digger", "📱Phone Addict", 
    "🤷‍♀️Mixed Signals", "🎭Fake", "❄️Cold", "🙄Rude", "⏰Always Late",
    "🍻Heavy Drinker", "🤥Dishonest", "😠Aggressive"
  ];

  const datingApps = [
    "Tinder", "Bumble", "Hinge", "Instagram", "IRL", "Raya", 
    "Facebook Dating", "Coffee Meets Bagel", "OkCupid", "Match", "eHarmony", "Other"
  ];

  const relationshipStages = [
    "First Date", "Hookup", "Casual Dating", "Talking Stage", "Exclusive", 
    "LTR", "Situationship", "Friends with Benefits", "One Night Stand"
  ];

  const prompts = [
    "What happened? Share your story...",
    "How did this experience make you feel?",
    "What would you want to tell your friends about this person?",
    "Any red flags or green flags you noticed?"
  ];

  const toggleTag = (tag: string) => {
    setStoryData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag) 
        ? prev.selectedTags.filter(t => t !== tag) 
        : [...prev.selectedTags, tag]
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    // Check if adding these files would exceed the limit
    if (uploadedImages.length + newFiles.length > 5) {
      toast({
        title: "Error",
        description: "You can only upload up to 5 photos",
        variant: "destructive"
      });
      return;
    }

    // Validate each file
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

    // Add files to state
    setUploadedImages(prev => [...prev, ...newFiles]);

    // Create previews for all new files
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
    console.log('Starting story publish process...');
    console.log('Story data:', storyData);
    console.log('Uploaded images:', uploadedImages);
    try {
      let imageUrls: string[] = [];

      // Upload all images if any were selected
      if (uploadedImages.length > 0) {
        console.log('Uploading images...');
        setUploading(true);
        for (const image of uploadedImages) {
          const url = await uploadImageToStorage(image);
          if (url) {
            imageUrls.push(url);
          }
        }
        setUploading(false);
        console.log('Images uploaded:', imageUrls);
      }
      
      const storyPayload = {
        content: storyData.content,
        tags: storyData.selectedTags,
        location: storyData.metadata.city,
        imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
        subjectName: storyData.personName,
        subjectPhone: storyData.personPhone
      };
      
      console.log('Story payload:', storyPayload);
      await createStory.mutateAsync(storyPayload);
      console.log('Story creation successful!');

      // Show success animation
      setShowSuccess(true);

      // Close after animation
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error: any) {
      console.error('Detailed error publishing story:', error);
      
      // Better error handling with specific messages
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

  // Success Animation Component
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-juice-blue/20 to-juice-coral/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="text-8xl mb-6 animate-bounce">🧃</div>
          <div className="text-6xl mb-4">
            <Sparkles className="h-16 w-16 text-juice-coral animate-pulse mx-auto" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Story Published!
          </h2>
          <p className="text-lg text-muted-foreground">
            Your tea has been spilled! ☕✨
          </p>
        </div>
      </div>
    );
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
          {/* Step 1: Person Details */}
          {step === 0 && (
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
                  onClick={handleNext}
                  disabled={!storyData.personName.trim() || !storyData.personPhone.trim()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Story Content */}
          {step === 1 && (
            <div className="space-y-6 p-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Share Your Experience</h3>
                <div className="space-y-4">
                  <Textarea
                    value={storyData.content}
                    onChange={(e) => setStoryData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your dating experience... What happened? How did it make you feel?"
                    className="min-h-[120px] resize-none"
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {storyData.content.length}/5000 characters
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!storyData.content.trim()}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Flags */}
          {step === 2 && (
            <div className="space-y-6 p-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Red Flags & Green Flags</h3>
                <p className="text-sm text-gray-600 mb-4">Select any flags that apply to this person</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-green-700 mb-2">Green Flags ✅</h4>
                    <div className="flex flex-wrap gap-2">
                      {greenFlags.map((flag) => (
                        <Badge
                          key={flag}
                          variant={storyData.selectedTags.includes(flag) ? "default" : "outline"}
                          className="cursor-pointer border-green-200 hover:border-green-300"
                          onClick={() => toggleTag(flag)}
                        >
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-red-700 mb-2">Red Flags 🚩</h4>
                    <div className="flex flex-wrap gap-2">
                      {redFlags.map((flag) => (
                        <Badge
                          key={flag}
                          variant={storyData.selectedTags.includes(flag) ? "default" : "outline"}
                          className="cursor-pointer border-red-200 hover:border-red-300"
                          onClick={() => toggleTag(flag)}
                        >
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Metadata */}
          {step === 3 && (
            <div className="space-y-6 p-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Details (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <Input
                      value={storyData.metadata.city}
                      onChange={(e) => setStoryData(prev => ({ 
                        ...prev, 
                        metadata: { ...prev.metadata, city: e.target.value }
                      }))}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Where you met</label>
                    <Select
                      value={storyData.metadata.datingApp}
                      onValueChange={(value) => setStoryData(prev => ({ 
                        ...prev, 
                        metadata: { ...prev.metadata, datingApp: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select app or method" />
                      </SelectTrigger>
                      <SelectContent>
                        {datingApps.map((app) => (
                          <SelectItem key={app} value={app.toLowerCase()}>
                            {app}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Relationship stage</label>
                    <Select
                      value={storyData.metadata.relationshipStage}
                      onValueChange={(value) => setStoryData(prev => ({ 
                        ...prev, 
                        metadata: { ...prev.metadata, relationshipStage: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipStages.map((stage) => (
                          <SelectItem key={stage} value={stage.toLowerCase()}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  onClick={handlePublish}
                  disabled={createStory.isPending || uploading}
                >
                  {createStory.isPending || uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {uploading ? "Uploading..." : "Publishing..."}
                    </span>
                  ) : (
                    "Publish Story"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateStory;