import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TourContextType {
  currentStep: number;
  isActive: boolean;
  showWelcome: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  dontShowAgain: () => void;
  restartTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check localStorage on load
    const dismissed = localStorage.getItem('civicpulse-tour-dismissed');
    if (!dismissed) {
      setShowWelcome(true);
    }
  }, []);

  const tourSteps = [
    { step: 1, route: '/' },
    { step: 2, route: '/' },
    { step: 3, route: '/tracker' },
    { step: 4, route: '/tracker' },
    { step: 5, route: '/tracker' },
    { step: 6, route: '/tracker' },
    { step: 7, route: '/tracker' },
    { step: 8, route: '/issue/iss-001' },
    { step: 9, route: '/issue/iss-001' },
    { step: 10, route: '/issue/iss-001' },
    { step: 11, route: '/issue/iss-001' },
    { step: 12, route: '/issue/iss-001' },
    { step: 13, route: '/issue/iss-001' },
    { step: 14, route: '/issue/iss-001' },
    { step: 15, route: '/issue/iss-001' },
  ];

  const handleStepNavigation = (stepNum: number) => {
    const stepConfig = tourSteps.find(s => s.step === stepNum);
    if (stepConfig && location.pathname !== stepConfig.route) {
      navigate(stepConfig.route);
    }
  };

  const startTour = () => {
    setShowWelcome(false);
    setIsActive(true);
    setCurrentStep(1);
    handleStepNavigation(1);
  };

  const nextStep = () => {
    if (currentStep < 15) {
      const next = currentStep + 1;
      setCurrentStep(next);
      handleStepNavigation(next);
    } else {
      skipTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      handleStepNavigation(prev);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    setShowWelcome(false);
  };

  const dontShowAgain = () => {
    localStorage.setItem('civicpulse-tour-dismissed', 'true');
    skipTour();
  };

  const restartTour = () => {
    setShowWelcome(false);
    setIsActive(true);
    setCurrentStep(1);
    handleStepNavigation(1);
  };

  return (
    <TourContext.Provider
      value={{
        currentStep,
        isActive,
        showWelcome,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        dontShowAgain,
        restartTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
