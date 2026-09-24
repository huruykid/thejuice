import { useCallback, useEffect, useRef, useState } from "react";
import BottomSheet from "@/components/ui/bottom-sheet";
import { useCreateStory } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRealIsAdmin } from "@/hooks/useRealIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import Composer from "./Composer";
import SuccessAnimation from "./SuccessAnimation";
import { track } from "@/lib/analytics";
import { shareInvite } from "@/lib/share";
import { useExperiment } from "@/hooks/useExperiments";

/**
 * Draft persistence (composer_ladder experiment). The photo requirement sends people out
 * to their camera roll — on iOS that can background the PWA and drop React state. The
 * text fields are mirrored to sessionStorage per user so a re-open resumes where they
 * left off. Photos (File objects) can't be persisted; the draft is cleared on publish.
 */
const draftKey = (userId?: string) => `juice_composer_draft_${userId ?? "anon"}`;
const readDraft = (userId?: string): Partial<StoryData> | null => {
  try {
    const raw = sessionStorage.getItem(draftKey(userId));
    return raw ? (JSON.parse(raw) as Partial<StoryData>) : null;
  } catch {
    return null;
  }
};

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

  const createStory = useCreateStory();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const [storyData, setStoryData] = useState<StoryData>(() => {
    const draft = readDraft(authUser?.id);
    // A prefilled name (from a search miss) wins over a stale draft's name; the rest of
    // the draft (verdict, story) carries over only when it was about the same person.
    const sameSubject =
      !!draft && (!initialSubjectName || (draft.personName ?? "").trim().toLowerCase() === initialSubjectName.trim().toLowerCase());
    return {
      content: sameSubject ? draft?.content ?? '' : '',
      selectedTags: [],
      metadata: { location: '', city_id: null },
      personName: initialSubjectName || (draft?.personName ?? ''),
      personPhone: '',
      verdict: sameSubject ? draft?.verdict ?? 0 : 0,
    };
  });

  // Mirror the text fields to sessionStorage as they change.
  useEffect(() => {
    try {
      const { personName, verdict, content } = storyData;
      if (!personName && !verdict && !content) sessionStorage.removeItem(draftKey(authUser?.id));
      else sessionStorage.setItem(draftKey(authUser?.id), JSON.stringify({ personName, verdict, content }));
    } catch { /* private mode */ }
  }, [storyData, authUser?.id]);

  // Abandonment logging: if this unmounts without a publish, record which required
  // fields were still empty and how long it was open. This is the number that tells us
  // whether the photo, the text, or the verdict is what stops people (6% of opens publish).
  const publishedRef = useRef(false);
  const openedAtRef = useRef(Date.now());
  const latestRef = useRef({ storyData, images: 0 });
  latestRef.current = { storyData, images: uploadedImages.length };
  useEffect(
    () => () => {
      if (publishedRef.current) return;
      const { storyData: d, images } = latestRef.current;
      const missing: string[] = [];
      if (!d.personName.trim()) missing.push("name");
      if (!d.verdict) missing.push("verdict");
      if (!d.content.trim()) missing.push("story");
      if (images === 0) missing.push("photo");
      void track("composer_abandoned", {
        missing,
        seconds: Math.round((Date.now() - openedAtRef.current) / 1000),
        prefilled: initialSubjectName.length > 0,
        verified: !isUnverified,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
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
  // post_share: keep the success screen up with a share button instead of auto-closing.
  const postShare = useExperiment("post_share") && !!authUser && !postAsAlias;

  const handleShare = async () => {
    if (!authUser) return;
    const result = await shareInvite({
      userId: authUser.id,
      surface: "post",
      text: "Verified guys only. Look her up before the date — and pass on the Juice after:",
    });
    if (result === "copied") toast({ title: "Link copied", description: "Paste it in the group chat." });
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
      publishedRef.current = true;
      try { sessionStorage.removeItem(draftKey(authUser?.id)); } catch { /* private mode */ }

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
      if (!postShare) {
        setTimeout(() => {
          onClose();
        }, 2500);
      }
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
    return postShare ? (
      <SuccessAnimation held={isUnverified} onShare={handleShare} onDone={onClose} />
    ) : (
      <SuccessAnimation held={isUnverified} />
    );
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
