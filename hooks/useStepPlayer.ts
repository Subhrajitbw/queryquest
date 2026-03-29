import { useState, useEffect, useCallback } from 'react';

export function useStepPlayer<T>(steps: T[], autoPlayInterval = 1500) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const next = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, steps.length - 1)));
  }, [steps.length]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      if (currentStep >= steps.length - 1) {
        timer = setTimeout(() => setIsPlaying(false), 0);
      } else {
        timer = setTimeout(next, autoPlayInterval);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, next, steps.length, autoPlayInterval]);

  return {
    currentStep,
    currentStepData: steps[currentStep],
    isPlaying,
    next,
    prev,
    reset,
    play,
    pause,
    goToStep,
    totalSteps: steps.length,
  };
}
