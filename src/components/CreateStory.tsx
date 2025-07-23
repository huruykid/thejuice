import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, X, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import CodenameSelector from "./CodenameSelector";
import { useCreateStory } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";

const CreateStory = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const [selectedCodenameId, setSelectedCodenameId] = useState<string | null>(null);
  const [storyData, setStoryData] = useState({
    content: "",
    selectedTags: [] as string[],
    ratings: {
      communication: 0,
      loyalty: 0,
      emotionalSafety: 0,
      overallVibe: 0,
    },
  });

  const createStory = useCreateStory();
  const { toast } = useToast();

  const availableTags = [
    "🚩Red Flag", "💯Loyal", "🫠Ghosted", "💸Gold Digger", "✨Thoughtful",
    "📱Phone Addict", "🤷‍♀️Mixed Signals", "🎭Fake", "🔥Chemistry", "❄️Cold",
    "🎵Music Lover", "🍕Foodie", "💼Career Focused", "🏃‍♂️Active", "🎨Creative"
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
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handlePublish = async () => {
    if (!selectedCodenameId) {
      toast({
        title: "Error",
        description: "Please select a codename",
        variant: "destructive",
      });
      return;
    }

    try {
      await createStory.mutateAsync({
        codenameId: selectedCodenameId,
        content: storyData.content,
        tags: storyData.selectedTags,
        ratings: storyData.ratings,
      });
      
      toast({
        title: "Success",
        description: "Your story has been published!",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish story. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          {/* Step 0: Codename Selection */}
          {step === 0 && (
            <div className="p-6 space-y-6">
              <CodenameSelector
                selectedCodenameId={selectedCodenameId}
                onSelect={setSelectedCodenameId}
              />
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
              
              <Textarea
                value={storyData.content}
                onChange={(e) => setStoryData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Spill the tea... Use initials, codenames, or emojis instead of real names"
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-juice-blue/10 flex gap-3">
          {step > 0 && (
            <Button variant="juice-outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              variant="juice"
              onClick={handleNext}
              disabled={
                (step === 0 && !selectedCodenameId) ||
                (step === 1 && !storyData.content.trim())
              }
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              variant="juice"
              onClick={handlePublish}
              disabled={createStory.isPending}
              className="flex-1"
            >
              {createStory.isPending ? "Publishing..." : "Publish Story"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreateStory;