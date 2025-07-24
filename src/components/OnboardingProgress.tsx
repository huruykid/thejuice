import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const OnboardingProgress = ({ currentStep, totalSteps, steps }: OnboardingProgressProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs text-muted-foreground">
          {steps[currentStep - 1]}
        </span>
      </div>
      
      <Progress value={progressPercentage} className="h-2 mb-4" />
      
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
              index + 1 < currentStep 
                ? 'bg-primary border-primary text-primary-foreground' 
                : index + 1 === currentStep
                ? 'border-primary text-primary'
                : 'border-muted text-muted-foreground'
            }`}>
              {index + 1 < currentStep ? (
                <Check className="w-3 h-3" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-xs text-muted-foreground mt-1 max-w-16 text-center">
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingProgress;