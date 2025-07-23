import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface CodenameCardProps {
  codename: {
    id: string;
    display_name: string;
    emoji: string | null;
    description?: string | null;
  };
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

const CodenameCard = ({ codename, size = "md", showDescription = false }: CodenameCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/codename/${codename.id}`);
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return (
    <div className="inline-block">
      <Badge
        variant="secondary"
        className={`cursor-pointer hover:bg-juice-lavender/80 transition-colors ${sizeClasses[size]}`}
        onClick={handleClick}
      >
        {codename.emoji && <span className="mr-1">{codename.emoji}</span>}
        {codename.display_name}
      </Badge>
      {showDescription && codename.description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          {codename.description}
        </p>
      )}
    </div>
  );
};

export default CodenameCard;