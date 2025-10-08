import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle2, Target, Calendar, Bell } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Bem-vindo ao FastTrack! 🙏",
    description: "Seu companheiro de jejum espiritual. Vamos começar sua jornada de fé e dedicação.",
    icon: CheckCircle2,
    color: "text-primary"
  },
  {
    title: "Defina seus Objetivos 🎯",
    description: "Jejum é sobre aproximação com Deus. Defina seus blocos de jejum e acompanhe seu progresso dia a dia.",
    icon: Target,
    color: "text-blue-500"
  },
  {
    title: "Acompanhe Seu Progresso 📊",
    description: "Marque cada dia completado, construa seu streak e conquiste badges. Cada dia é uma vitória!",
    icon: Calendar,
    color: "text-green-500"
  },
  {
    title: "Nunca Esqueça 🔔",
    description: "Configure lembretes diários e receba versículos motivacionais. Estamos com você nesta jornada!",
    icon: Bell,
    color: "text-purple-500"
  }
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      toast({
        title: "Bem-vindo! 🎉",
        description: "Vamos começar sua jornada de jejum!",
      });

      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar o onboarding",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full animate-scale-in">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ${currentStepData.color}`}>
              <Icon className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={isCompleting}
              className="w-full"
              size="lg"
            >
              {currentStep === steps.length - 1 ? (
                isCompleting ? "Iniciando..." : "Começar 🚀"
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
