import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Check } from "lucide-react";
import { useCodenames, useCreateCodename } from "@/hooks/useStories";
import { useToast } from "@/hooks/use-toast";

interface CodenameSelectorProps {
  selectedCodenameId: string | null;
  onSelect: (codenameId: string) => void;
}

const CodenameSelector = ({ selectedCodenameId, onSelect }: CodenameSelectorProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newDescription, setNewDescription] = useState("");
  
  const { data: codenames = [], isLoading } = useCodenames();
  const createCodename = useCreateCodename();
  const { toast } = useToast();

  const handleCreateCodename = async () => {
    if (!newDisplayName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a codename",
        variant: "destructive",
      });
      return;
    }

    try {
      const codename = await createCodename.mutateAsync({
        displayName: newDisplayName.trim(),
        emoji: newEmoji.trim() || undefined,
        description: newDescription.trim() || undefined,
      });

      onSelect(codename.id);
      setShowCreateForm(false);
      setNewDisplayName("");
      setNewEmoji("");
      setNewDescription("");
      
      toast({
        title: "Success",
        description: "Codename created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create codename. It might already exist.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading codenames...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Choose your anonymous identity</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select an existing codename or create a new one
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {codenames.map((codename) => (
          <div
            key={codename.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-juice-lavender/20 ${
              selectedCodenameId === codename.id
                ? "border-juice-blue bg-juice-lavender/30"
                : "border-gray-200"
            }`}
            onClick={() => onSelect(codename.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {codename.emoji && <span className="text-lg">{codename.emoji}</span>}
                <span className="font-medium">{codename.display_name}</span>
              </div>
              {selectedCodenameId === codename.id && (
                <Check className="h-4 w-4 text-juice-blue" />
              )}
            </div>
            {codename.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {codename.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {!showCreateForm ? (
        <Button
          variant="outline"
          onClick={() => setShowCreateForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Codename
        </Button>
      ) : (
        <div className="space-y-3 p-4 bg-juice-lavender/10 rounded-lg">
          <div>
            <Label htmlFor="emoji" className="text-sm">Emoji (optional)</Label>
            <Input
              id="emoji"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              placeholder="💄 🎭 📚"
              maxLength={2}
              className="text-center"
            />
          </div>
          
          <div>
            <Label htmlFor="displayName" className="text-sm">Codename *</Label>
            <Input
              id="displayName"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="MissVegas, Drama Queen, etc."
              maxLength={50}
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-sm">Description (optional)</Label>
            <Input
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="A brief description of this persona"
              maxLength={100}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCreateCodename}
              disabled={createCodename.isPending}
              className="flex-1"
            >
              {createCodename.isPending ? "Creating..." : "Create"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodenameSelector;