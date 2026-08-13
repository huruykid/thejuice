import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, ChevronDown, Lock, MapPin, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { JuiceIcon, MilkIcon } from "@/components/icons/BrandVoteIcons";
import { useToast } from "@/hooks/use-toast";
import { useCities } from "@/hooks/useCities";
import PhoneInput, { parsePhoneNumber, type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { StoryData } from "./index";

/**
 * Single-screen composer — IG-style "everything at capture".
 *
 * Required, in visual order: who (name), the verdict (juice/milk), the story.
 * Everything else (photos, phone, city) is progressive disclosure behind
 * "Add details" — enrichment, not a gate. No steps, no Next buttons.
 */
interface ComposerProps {
  storyData: StoryData;
  setStoryData: (updater: (prev: StoryData) => StoryData) => void;
  uploadedImages: File[];
  setUploadedImages: (updater: (prev: File[]) => File[]) => void;
  imagePreviews: string[];
  setImagePreviews: (updater: (prev: string[]) => string[]) => void;
  onPublish: () => void;
  onClose: () => void;
  isLoading: boolean;
  uploading: boolean;
  /** Operator posting: this one publishes under a fresh random codename. */
  postAsAlias?: boolean;
  /**
   * Hold the publish button without claiming anything is in flight — used while the
   * caller is still resolving which identity the post goes out under.
   */
  publishBlocked?: boolean;
}

const Composer = ({
  storyData,
  setStoryData,
  uploadedImages,
  setUploadedImages,
  imagePreviews,
  setImagePreviews,
  onPublish,
  onClose,
  isLoading,
  uploading,
  postAsAlias = false,
  publishBlocked = false,
}: ComposerProps) => {
  const { toast } = useToast();
  const [ack, setAck] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [defaultCountry, setDefaultCountry] = useState<Country>("US");

  // Preset the phone country from the browser locale (e.g. "en-GB" → GB).
  // Deliberately NOT an IP-geolocation call: this is a privacy-first product,
  // and shipping every composer-open to a third party is off-posture.
  useEffect(() => {
    const region = navigator.language?.split("-")[1]?.toUpperCase();
    if (region && /^[A-Z]{2}$/.test(region)) setDefaultCountry(region as Country);
  }, []);

  // City picker (optional) — DB cities with free-text fallback.
  const [cityQuery, setCityQuery] = useState(storyData.metadata.location ?? "");
  const [cityOpen, setCityOpen] = useState(false);
  const { data: cityResults = [] } = useCities(cityQuery);
  const typedCity = cityQuery.trim();
  const showCityFreeText =
    typedCity.length >= 2 &&
    !cityResults.some((c) => c.city_name.toLowerCase() === typedCity.toLowerCase());
  const pickCity = (name: string, id: string | null) => {
    setCityQuery(name);
    setCityOpen(false);
    setStoryData((prev) => ({ ...prev, metadata: { ...prev.metadata, city_id: id, location: name } }));
  };
  const clearCity = () => {
    setCityQuery("");
    setStoryData((prev) => ({ ...prev, metadata: { ...prev.metadata, city_id: null, location: "" } }));
  };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || "";
    setStoryData((prev) => ({ ...prev, personPhone: phoneValue }));
    if (!phoneValue) return setPhoneError("");
    try {
      const parsed = parsePhoneNumber(phoneValue);
      setPhoneError(parsed && parsed.isValid() ? "" : "Please enter a valid phone number");
    } catch {
      setPhoneError("Please enter a valid phone number");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Keep every valid file; report the rejects. One bad file in a batch of
    // five must not throw away the other four.
    const rejected: string[] = [];
    const valid = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} isn't an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        rejected.push(`${file.name} is over 5MB`);
        return false;
      }
      return true;
    });

    const room = 5 - uploadedImages.length;
    if (valid.length > room) {
      rejected.push(`only ${room} more photo${room === 1 ? "" : "s"} fit (max 5)`);
    }
    const accepted = valid.slice(0, Math.max(room, 0));

    if (rejected.length > 0) {
      toast({
        title: accepted.length > 0 ? "Some photos were skipped" : "Photos not added",
        description: rejected.join("; "),
        variant: "destructive",
      });
    }
    if (accepted.length === 0) return;

    setUploadedImages((prev) => [...prev, ...accepted]);
    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const verdict = storyData.verdict || 0;
  const setVerdict = (v: number) =>
    setStoryData((prev) => ({ ...prev, verdict: prev.verdict === v ? 0 : v }));

  const canPublish =
    !!storyData.personName.trim() &&
    verdict !== 0 &&
    !!storyData.content.trim() &&
    uploadedImages.length > 0 &&
    ack &&
    !phoneError;

  const detailCount =
    (storyData.personPhone ? 1 : 0) + (storyData.metadata.location ? 1 : 0);

  return (
    <div className="space-y-5 p-6">
      {/* Operator posting. Say it out loud in the composer — silently publishing under
          a name you didn't choose is exactly the kind of thing you want confirmed. */}
      {postAsAlias && (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Publishing under a new random codename — a different one on every post.
        </p>
      )}

      {/* Who */}
      <div>
        <label htmlFor="composer-name" className="block text-sm font-medium mb-1">
          Who is she? <span className="text-destructive">*</span>
        </label>
        <Input
          id="composer-name"
          value={storyData.personName}
          onChange={(e) => setStoryData((prev) => ({ ...prev, personName: e.target.value }))}
          placeholder="@username or first name"
          autoComplete="off"
          required
        />
      </div>

      {/* The verdict — the product. Required, at capture, not three steps deep. */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Your verdict <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2" role="group" aria-label="Your verdict">
          <button
            type="button"
            onClick={() => setVerdict(1)}
            aria-pressed={verdict > 0}
            className={cn(
              "flex-1 min-h-11 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all active:scale-95",
              verdict > 0
                ? "bg-success/15 border-success text-success"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <JuiceIcon className="h-5 w-5" />
            {/* Flag name leads, slang follows. At the moment of judgement the user
                is answering "was she good or bad", not recalling what Juice means —
                so the plain word takes the primary line. The slang stays underneath
                because the feed votes in it and the app is named after it; teaching
                only "green flag" here would just move the translation downstream. */}
            <span className="flex flex-col items-start leading-tight">
              <span>Green flag</span>
              <span className="text-[10px] font-medium opacity-70">juice</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setVerdict(-1)}
            aria-pressed={verdict < 0}
            className={cn(
              "flex-1 min-h-11 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all active:scale-95",
              verdict < 0
                ? "bg-destructive/15 border-destructive text-destructive"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <MilkIcon className="h-5 w-5" />
            <span className="flex flex-col items-start leading-tight">
              <span>Red flag</span>
              <span className="text-[10px] font-medium opacity-70">milk</span>
            </span>
          </button>
        </div>
      </div>

      {/* The story */}
      <div>
        <label htmlFor="composer-story" className="block text-sm font-medium mb-1">
          What happened? <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="composer-story"
          value={storyData.content}
          onChange={(e) => setStoryData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="Spill it — what other guys should know before a date with her."
          className="min-h-[110px] resize-none"
          maxLength={5000}
        />
        <p className="text-xs text-muted-foreground mt-1">{storyData.content.length}/5000</p>
      </div>

      {/* Photos — required. A photo is how other guys recognize who it's about. */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">
            Photos <span className="text-destructive">*</span>
          </label>
          <span className="text-xs text-muted-foreground">at least 1 · up to 5</span>
        </div>
        {imagePreviews.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="composer-image-upload"
            />
            <label htmlFor="composer-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Camera className="h-7 w-7 text-muted-foreground" />
              <span className="text-sm font-medium">Tap to add photos</span>
              <span className="text-xs text-muted-foreground">JPG, PNG up to 5MB each</span>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            {imagePreviews.length < 5 && (
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="composer-image-upload-more"
                />
                <label
                  htmlFor="composer-image-upload-more"
                  className="cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Add more ({imagePreviews.length}/5)
                  </span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progressive disclosure: enrichment, never a gate. */}
      <div className="border border-border rounded-lg">
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          aria-expanded={detailsOpen}
          className="w-full min-h-11 flex items-center justify-between px-3 py-2.5 text-sm font-medium"
        >
          <span>
            Add details{" "}
            <span className="font-normal text-muted-foreground">
              — phone, city{detailCount > 0 ? ` (${detailCount})` : ""}
            </span>
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", detailsOpen && "rotate-180")}
            aria-hidden
          />
        </button>

        {detailsOpen && (
          <div className="px-3 pb-4 space-y-5 border-t border-border pt-4">
            {/* Phone (optional) */}
            <div>
              <span className="block text-sm font-medium mb-1">Her phone</span>
              <PhoneInput
                defaultCountry={defaultCountry}
                value={storyData.personPhone}
                onChange={handlePhoneChange}
                placeholder="+1 555-555-5555"
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  phoneError && "border-destructive"
                )}
                international
                countryCallingCodeEditable={false}
              />
              {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                Never shown publicly — only used to match stories to the right person.
              </p>
            </div>

            {/* City (optional) */}
            <div>
              <span className="block text-sm font-medium mb-1">City</span>
              <div className="relative">
                <input
                  id="composer-city"
                  value={cityQuery}
                  onChange={(e) => { setCityQuery(e.target.value); setCityOpen(true); }}
                  onFocus={() => setCityOpen(true)}
                  onBlur={() => window.setTimeout(() => setCityOpen(false), 150)}
                  placeholder="Search a city"
                  autoComplete="off"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                {cityQuery && (
                  <button
                    type="button"
                    onClick={clearCity}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                {cityOpen && (cityResults.length > 0 || showCityFreeText) && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-border bg-background shadow-lg">
                    {cityResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          pickCity(c.state_province ? `${c.city_name}, ${c.state_province}` : c.city_name, c.id)
                        }
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>
                          {c.city_name}
                          {c.state_province && <span className="text-muted-foreground">, {c.state_province}</span>}
                        </span>
                      </button>
                    ))}
                    {showCityFreeText && (
                      <button
                        type="button"
                        onClick={() => pickCity(typedCity, null)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted border-t border-border"
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span>Use “<span className="font-medium">{typedCity}</span>”</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Honesty ack — legal posture, stays required. */}
      <label className="flex gap-2 items-start text-xs text-muted-foreground cursor-pointer">
        <Checkbox checked={ack} onCheckedChange={(v) => setAck(Boolean(v))} className="mt-0.5" />
        <span>
          This is my real, alleged experience. I understand everything I post should be framed as{" "}
          <em>allegedly</em> what happened and I won't fabricate events, doctor photos, or share
          details I can't stand behind.
        </span>
      </label>

      <div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onPublish} disabled={isLoading || publishBlocked || !canPublish}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                {uploading ? "Uploading..." : "Publishing..."}
              </span>
            ) : (
              "Share the Juice"
            )}
          </Button>
        </div>
        {/* Name the first missing requirement instead of leaving a dead button. */}
        {!isLoading && !canPublish && (
          <p className="text-xs text-muted-foreground text-right mt-2" aria-live="polite">
            {!storyData.personName.trim()
              ? "Add her name to publish"
              : verdict === 0
                ? "Pick a verdict to publish"
                : !storyData.content.trim()
                  ? "Write what happened to publish"
                  : uploadedImages.length === 0
                    ? "Add at least one photo to publish"
                    : phoneError
                      ? "Fix the phone number to publish"
                      : "Confirm the honesty checkbox to publish"}
          </p>
        )}
      </div>
    </div>
  );
};

export default Composer;
