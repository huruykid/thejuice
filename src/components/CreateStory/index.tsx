import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateStory } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRealIsAdmin } from "@/hooks/useRealIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import Composer from "./Composer";
import SuccessAnimation from "./SuccessAnimation";

/** Kept in step with the sheet's exit transition duration below. */
const EXIT_MS = 220;

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  // The parent unmounts this component the instant onClose fires, so the sheet has
  // to play its exit *before* saying so — otherwise it slides up on open and then
  // vanishes on close, which reads as a glitch rather than a dismissal.
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (closeTimer.current !== null) return; // already on the way out
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  // A close in flight when this unmounts (publish success races the X button)
  // would otherwise fire onClose against a dead component.
  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    []
  );
  
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
  const { user: authUser } = useAuth();
  // Operator posts publish under a fresh random codename instead of the admin's own
  // handle, so the feed doesn't read as one person talking to himself. The real role
  // check (not the "View as" override) decides; the RPC re-checks it server-side.
  //
  // Publishing is held until this resolves. Losing that race would publish under the
  // admin's real handle — the exact outcome this feature exists to prevent, and not
  // something you can take back once it is in the feed. In practice the wait is zero:
  // useAuth primes the same query key before this modal can open.
  const { isAdmin: postAsAlias, isLoading: roleLoading } = useRealIsAdmin(authUser?.id);
  const roleUnresolved = !authUser || roleLoading;

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
      // Object paths ship to every client inside `image_url`. Normal posts go under
      // the poster's uid (what the storage RLS policy requires); aliased posts must
      // NOT, or the admin's uid would be printed on every one of them and undo the
      // anonymity. `seed/` is the operator prefix admins are allowed to write to.
      const filePath = postAsAlias
        ? `seed/${crypto.randomUUID()}/${fileName}`
        : `${user.id}/${fileName}`;

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

      const storyPayload = {
        content: storyData.content,
        tags: storyData.selectedTags,
        city_id: storyData.metadata.city_id ?? null,
        location: storyData.metadata.location?.trim() || null,
        imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
        subjectName: storyData.personName,
        subjectPhone: storyData.personPhone,
        verdict: storyData.verdict,
        asAlias: postAsAlias,
      };

      const published = await createStory.mutateAsync(storyPayload);

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

      setShowSuccess(true);
      if (published?.author_alias) {
        toast({
          title: "Posted",
          description: `Published as @${published.author_alias}.`,
        });
      }
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
    <div
      className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4",
        "transition-opacity duration-200 motion-reduce:transition-none",
        closing ? "opacity-0" : "opacity-100"
      )}
    >
      <Card
        className={cn(
          "w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden",
          // Rises off the bottom edge on phones, where the sheet is flush with the
          // ground; on sm+ it is a centered dialog, so a full-height slide would
          // read as the card falling out of the viewport — it scales in instead.
          // Durations are spelled out rather than using duration-*: tailwindcss-animate
          // redefines that utility to set animation-duration, so a `duration-200` and a
          // `duration-300` on the same element fight over BOTH properties and whichever
          // lands later in the sheet wins. Exit must stay in step with EXIT_MS above.
          "will-change-transform transition-transform [transition-duration:200ms] ease-in motion-reduce:transition-none",
          closing
            ? "translate-y-full sm:translate-y-0 sm:scale-95"
            : "translate-y-0 sm:scale-100",
          !closing &&
            "animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 [animation-duration:300ms] ease-out motion-reduce:animate-none"
        )}
      >
        {/* Grab handle. Purely a signifier — this sheet isn't drag-dismissible — but
            it's the standard cue that the panel came up from the bottom edge. */}
        <div className="sm:hidden flex justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-9 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pt-4 sm:pt-6 border-b border-primary/10">
          <h2 className="text-xl font-bold text-foreground">Share the Juice</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
          <Composer
            storyData={storyData}
            setStoryData={setStoryData}
            uploadedImages={uploadedImages}
            setUploadedImages={setUploadedImages}
            imagePreviews={imagePreviews}
            setImagePreviews={setImagePreviews}
            onPublish={handlePublish}
            onClose={handleClose}
            isLoading={createStory.isPending || uploading}
            uploading={uploading}
            postAsAlias={postAsAlias}
            publishBlocked={roleUnresolved}
          />
        </div>
      </Card>
    </div>
  );
};

export default CreateStory;