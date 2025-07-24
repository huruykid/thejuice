import { Progress } from "@/components/ui/progress";
import { Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  estimatedTimeRemaining?: string;
  completedSteps?: string[];
}

const EnhancedProgress = ({ 
  currentStep, 
  totalSteps, 
  steps, 
  estimatedTimeRemaining,
  completedSteps = [] 
}: EnhancedProgressProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-6 space-y-4">
      {/* Header with step info and estimated time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">
            {steps[currentStep - 1]}
          </span>
        </div>
        {estimatedTimeRemaining && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {estimatedTimeRemaining}
          </div>
        )}
      </div>
      
      {/* Animated progress bar */}
      <div className="relative">
        <Progress value={progressPercentage} className="h-2" />
        <div 
          className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-primary/50 to-primary opacity-50 transition-all duration-1000 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(step) || stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all duration-300",
                isCompleted && "bg-primary border-primary text-primary-foreground scale-110",
                isCurrent && "border-primary text-primary bg-primary/10 animate-pulse",
                isPending && "border-muted text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 max-w-16 text-center transition-colors duration-300",
                isCompleted && "text-primary font-medium",
                isCurrent && "text-primary font-medium",
                isPending && "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Motivational message */}
      {currentStep < totalSteps && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {currentStep === 1 && "Welcome! Let's get you set up quickly."}
            {currentStep === 2 && "Great start! Now let's create your profile."}
            {currentStep === 3 && "Almost there! Time for a quick photo."}
            {currentStep === 4 && "Excellent! Please review our guidelines."}
            {currentStep === 5 && "Perfect! We're reviewing your submission."}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedProgress;