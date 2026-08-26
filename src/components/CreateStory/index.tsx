import { useCallback, useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/ui/bottom-sheet";
import { useCreateStory } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRealIsAdmin } from "@/hooks/useRealIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import Composer from "./Composer";
import SuccessAnimation from "./SuccessAnimation";

/** Parent unmounts on onClose, so give vaul's exit animation time to play first. */
const EXIT_MS = 450;

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
  initialSubjectName = "",
}: {
  onClose: () => void;
  /** Not yet approved: the post is held until their selfie is, and the copy says so. */
  isUnverified?: boolean;
  /** Prefilled from a search miss — the name the user just looked for and didn't find. */
  initialSubjectName?: string;
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  // The parent mounts/unmounts this component, but vaul animates on open-state
  // transitions — so open starts false, flips true on the next frame (slide-in),
  // and the close path flips it false and defers onClose until the slide-out ends.
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(() => {
    if (closeTimer.current !== null) return; // already on the way out
    setOpen(false);
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
    personName: initialSubjectName,
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
        verified: !isUnverified,
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
          title: "Saved — one step left",
          description:
            "Your review goes live once your selfie is approved. Verify now and it publishes with your account.",
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
    <BottomSheet open={open} onClose={handleClose} title="Share the Juice">
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
    </BottomSheet>
  );
};

export default CreateStory;
