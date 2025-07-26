
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, X, Plus, Sparkles, Camera, Upload, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCreateStory } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CreateStory = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [storyData, setStoryData] = useState({
    personName: "",
    personPhone: "",
    content: "",
    selectedTags: [] as string[],
    ratings: {
      communication: 0,
      loyalty: 0,
      emotionalSafety: 0,
      overallVibe: 0,
    },
    metadata: {
      city: "",
      app: "",
      stage: "",
    },
  });

  const createStory = useCreateStory();
  const { toast } = useToast();

  const availableTags = [
    "🚩Red Flag", "💯Loyal", "🫠Ghosted", "💸Gold Digger", "✨Thoughtful",
    "📱Phone Addict", "🤷‍♀️Mixed Signals", "🎭Fake", "🔥Chemistry", "❄️Cold",
    "🎵Music Lover", "🍕Foodie", "💼Career Focused", "🏃‍♂️Active", "🎨Creative"
  ];

  const datingApps = [
    "Tinder", "Bumble", "Hinge", "Instagram", "IRL", "Raya", "Facebook Dating", 
    "Coffee Meets Bagel", "OkCupid", "Match", "eHarmony", "Other"
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

  const setRating = (category: keyof typeof storyData.ratings, rating: number) => {
    setStoryData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: rating
      }
    }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
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
        variant: "destructive",
      });
      return;
    }

    // Validate each file
    for (const file of newFiles) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: `${file.name} must be less than 5MB`,
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error", 
          description: `${file.name} is not an image file`,
          variant: "destructive",
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
      setUploading(true);
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
          variant: "destructive",
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
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
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
        ratings: {
          communication: storyData.ratings.communication,
          loyalty: storyData.ratings.loyalty,
          emotionalSafety: storyData.ratings.emotionalSafety,
          overallVibe: storyData.ratings.overallVibe,
        },
        location: storyData.metadata.city,
        imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
        subjectName: storyData.personName,
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
      
    } catch (error) {
      console.error('Detailed error publishing story:', error);
      toast({
        title: "Error",
        description: "Failed to publish story. Please try again.",
        variant: "destructive",
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
          {/* Step 0: Person Name */}
          {step === 0 && (
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Who's this story about? 👤
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter their name, username, or phone number (all kept anonymous!)
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Name or Username
                  </label>
                  <Input
                    value={storyData.personName}
                    onChange={(e) => setStoryData(prev => ({ ...prev, personName: e.target.value }))}
                    placeholder="e.g., @username, initials, or descriptive name..."
                    className="rounded-2xl border-juice-blue/20 focus:border-juice-blue"
                    maxLength={50}
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {storyData.personName.length}/50 characters
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-juice-blue/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Phone Number (Optional)
                  </label>
                  <Input
                    value={storyData.personPhone}
                    onChange={(e) => setStoryData(prev => ({ ...prev, personPhone: e.target.value }))}
                    placeholder="e.g., +1234567890, (555) 123-4567..."
                    className="rounded-2xl border-juice-blue/20 focus:border-juice-blue"
                    type="tel"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    📱 Only used for searching. Phone numbers are never displayed to other users
                  </p>
                </div>
              </div>

              <div className="bg-juice-lavender/30 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Privacy Tip:</strong> Phone numbers are only used to help users find or create profiles of people they're writing about—especially when names or social handles aren't available. Phone numbers are never displayed publicly and are only used for matching purposes behind the scenes.
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Story Content */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  What's your tea? ☕
                </h3>
                <p className="text-sm text-muted-foreground">
                  {prompts[0]}
                </p>
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
                    <label 
                      htmlFor="image-upload" 
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
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
                        <label 
                          htmlFor="image-upload-more" 
                          className="cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Add more photos ({imagePreviews.length}/5)</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Textarea
                value={storyData.content}
                onChange={(e) => setStoryData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Pour the juice... Use initials, codenames, or emojis instead of real names"
                className="min-h-32 rounded-2xl border-juice-blue/20 focus:border-juice-blue"
                maxLength={500}
              />
              
              <div className="text-right text-xs text-muted-foreground">
                {storyData.content.length}/500 characters
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Quick prompts to help you share:
                </p>
                <div className="space-y-2">
                  {prompts.slice(1).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setStoryData(prev => ({ 
                        ...prev, 
                        content: prev.content + (prev.content ? '\n\n' : '') + prompt + ' '
                      }))}
                      className="text-left text-sm text-juice-blue hover:text-juice-blue-dark transition-smooth w-full p-2 rounded-xl hover:bg-juice-lavender/30"
                    >
                      • {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tags */}
          {step === 2 && (
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Add some vibes 🏷️
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose tags that describe this experience
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={storyData.selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-smooth rounded-full px-3 py-1 ${
                      storyData.selectedTags.includes(tag)
                        ? "bg-juice-blue text-white"
                        : "border-juice-blue/30 text-juice-blue hover:bg-juice-blue hover:text-white"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <Button
                variant="juice-soft"
                className="w-full flex items-center gap-2"
                onClick={() => {
                  const customTag = prompt("Add a custom tag:");
                  if (customTag) toggleTag(customTag);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Custom Tag
              </Button>
            </div>
          )}

          {/* Step 3: Ratings */}
          {step === 3 && (
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Rate the experience ⭐
                </h3>
                <p className="text-sm text-muted-foreground">
                  Help others know what to expect
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(storyData.ratings).map(([category, rating]) => (
                  <div key={category} className="space-y-2">
                    <label className="text-sm font-medium text-foreground capitalize">
                      {category === 'emotionalSafety' ? 'Emotional Safety' : 
                       category === 'overallVibe' ? 'Overall Vibe' : category}
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(category as keyof typeof storyData.ratings, star)}
                          className="transition-smooth"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= rating
                                ? "fill-juice-coral text-juice-coral"
                                : "text-muted-foreground hover:text-juice-coral"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Optional Metadata */}
          {step === 4 && (
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Add some context 📍
                </h3>
                <p className="text-sm text-muted-foreground">
                  Optional details to help others relate (all anonymous)
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    City (optional)
                  </label>
                  <Input
                    value={storyData.metadata.city}
                    onChange={(e) => setStoryData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, city: e.target.value }
                    }))}
                    placeholder="e.g., Los Angeles, NYC, Miami..."
                    className="rounded-2xl border-juice-blue/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Where you met (optional)
                  </label>
                  <Select 
                    value={storyData.metadata.app} 
                    onValueChange={(value) => setStoryData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, app: value }
                    }))}
                  >
                    <SelectTrigger className="rounded-2xl border-juice-blue/20">
                      <SelectValue placeholder="Select an app or method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-juice-blue/20 rounded-2xl shadow-lg">
                      {datingApps.map((app) => (
                        <SelectItem key={app} value={app.toLowerCase()}>
                          {app}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Relationship stage (optional)
                  </label>
                  <Select 
                    value={storyData.metadata.stage} 
                    onValueChange={(value) => setStoryData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, stage: value }
                    }))}
                  >
                    <SelectTrigger className="rounded-2xl border-juice-blue/20">
                      <SelectValue placeholder="What stage were you at?" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-juice-blue/20 rounded-2xl shadow-lg">
                      {relationshipStages.map((stage) => (
                        <SelectItem key={stage} value={stage.toLowerCase()}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-juice-lavender/30 rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Privacy Note:</strong> All stories are posted anonymously. 
                  This metadata helps others find relatable experiences but never reveals your identity.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-juice-blue/10 flex gap-3">
          {step > 0 && (
            <Button variant="juice-outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              variant="juice"
              onClick={handleNext}
              disabled={
                (step === 0 && !storyData.personName.trim() && !storyData.personPhone.trim()) ||
                (step === 1 && !storyData.content.trim())
              }
              className="flex-1"
            >
              {step === 3 ? "Add Details (Optional)" : "Next"}
            </Button>
          ) : (
            <Button
              variant="juice"
              onClick={handlePublish}
              disabled={createStory.isPending || uploading}
              className="flex-1 relative overflow-hidden"
            >
              {createStory.isPending || uploading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {uploading ? "Uploading..." : "Publishing..."}
                </span>
              ) : (
                "🍊 Give the Juice!"
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateStory;
