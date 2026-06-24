import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitDispute } from "@/hooks/useDisputes";
import { toast } from "sonner";

const REMOVAL_REASONS = [
  "This story is false",
  "I am not this person",
  "This contains private information I did not consent to share",
  "Other",
];

const DisputeRequest = () => {
  const [searchParams] = useSearchParams();
  const prefillName = searchParams.get("name") ?? "";

  const [subjectName, setSubjectName] = useState(prefillName);
  const [contactEmail, setContactEmail] = useState("");
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitDispute = useSubmitDispute();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectName.trim()) {
      toast.error("Please enter the name used in the story.");
      return;
    }
    if (!contactEmail.trim()) {
      toast.error("Please enter your email address so we can follow up.");
      return;
    }
    if (!reason) {
      toast.error("Please select a reason for your request.");
      return;
    }

    try {
      await submitDispute.mutateAsync({
        subject_name: subjectName.trim(),
        contact_email: contactEmail.trim(),
        reason,
        additional_info: additionalInfo.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again in a moment.");
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Request Received | Juice</title>
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/15 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-semibold">Request received</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've received your request. Our team reviews all requests within 5 business days.
                We'll contact you at the email address you provided.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Request Story Removal | Juice</title>
        <meta
          name="description"
          content="If a story on Juice mentions you and you believe it should be removed, you can submit a removal request here. We review all requests carefully."
        />
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Request Story Removal</CardTitle>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                If a story on Juice mentions you and you believe it should be removed,
                you can submit a request here. We take all removal requests seriously
                and review each one carefully.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="subject-name">Your name as it appears in the story</Label>
                  <Input
                    id="subject-name"
                    placeholder="Enter the name used in the story"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-email">Your email address</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="we'll use this to follow up with you"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    maxLength={254}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reason">Reason for removal request</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMOVAL_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="additional-info">
                    Anything else we should know?{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="additional-info"
                    rows={4}
                    placeholder="Any additional context that might help us review your request"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    maxLength={2000}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitDispute.isPending}
                >
                  {submitDispute.isPending ? "Submitting…" : "Submit removal request"}
                </Button>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Your email address will only be used to follow up on this request.
                  We'll never share it.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DisputeRequest;
