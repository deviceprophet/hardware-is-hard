/**
 * Tutorial System - Interactive Onboarding
 *
 * "Show, Don't Tell" approach with contextual popups.
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Lightbulb } from 'lucide-react';

// Tutorial steps configuration
export const TUTORIAL_STEPS = {
    welcome: {
        id: 'welcome',
        title: 'Welcome to Prophet Labs',
        subtitle: 'The Recall Run: IoT Doom Simulator',
        content:
            'Your goal: Keep an IoT device alive for 5 years without going bankrupt or accumulating too much technical debt.',
        highlight: null,
        phase: 'splash'
    },
    setup_device: {
        id: 'setup_device',
        title: 'Choose Your Device',
        content:
            'Each device has different challenges. Check the "Difficulty" rating - harder devices have tighter budgets and more regulatory requirements.',
        highlight: '[data-testid="device-select"]',
        phase: 'setup'
    },
    setup_budget: {
        id: 'setup_budget',
        title: 'Watch Your Budget',
        content:
            'Money keeps the lights on. If you run out, game over. Maintenance costs drain your budget every month.',
        highlight: '[data-testid="budget-display"]',
        phase: 'setup'
    },
    sim_doom: {
        id: 'sim_doom',
        title: 'The Doom Meter',
        content:
            'This is Technical Debt. Bad decisions add Doom. If it hits 100%, your product fails catastrophically.',
        highlight: '[data-testid="doom-meter"]',
        phase: 'simulation'
    },
    sim_ship: {
        id: 'sim_ship',
        title: 'Generate Revenue',
        content:
            'Need cash? Deploy a monetized OTA update. It earns revenue but increases Technical Debt (Doom) due to rushed features. You cannot deploy if Doom > 50%.',
        highlight: '[data-testid="ship-btn"]',
        phase: 'simulation'
    },
    sim_events: {
        id: 'sim_events',
        title: 'Crisis Events',
        content:
            'Random disasters will strike. Regulatory audits, cyberattacks, supply chain issues. Your choices matter.',
        highlight: null,
        phase: 'simulation'
    }
} as const;

type TutorialStepId = keyof typeof TUTORIAL_STEPS;

interface TutorialContextType {
    isActive: boolean;
    currentStep: TutorialStepId | null;
    completedSteps: Set<TutorialStepId>;
    showStep: (stepId: TutorialStepId) => void;
    completeStep: (stepId: TutorialStepId) => void;
    closeStep: () => void;
    skipTutorial: () => void;
    resetTutorial: () => void;
    enableTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

const STORAGE_KEY = 'hardware_tutorial_completed';

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState<TutorialStepId | null>(null);
    const [completedSteps, setCompletedSteps] = useState<Set<TutorialStepId>>(new Set());

    // Load completed state from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            setCompletedSteps(new Set(parsed.completed || []));
            setIsActive(!parsed.skipped);
        } else {
            // First time user - start tutorial
            setIsActive(true);
            setCurrentStep('welcome');
        }
    }, []);

    const showStep = (stepId: TutorialStepId) => {
        if (isActive && !completedSteps.has(stepId)) {
            setCurrentStep(stepId);
        }
    };

    const completeStep = (stepId: TutorialStepId) => {
        const newCompleted = new Set(completedSteps);
        newCompleted.add(stepId);
        setCompletedSteps(newCompleted);
        setCurrentStep(null);

        // Save to localStorage
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                completed: Array.from(newCompleted),
                skipped: false
            })
        );
    };

    const closeStep = () => {
        setCurrentStep(null);
    };

    const skipTutorial = () => {
        setIsActive(false);
        setCurrentStep(null);
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                completed: Array.from(completedSteps),
                skipped: true
            })
        );
    };

    const resetTutorial = () => {
        setIsActive(true);
        setCompletedSteps(new Set());
        setCurrentStep('welcome');
        localStorage.removeItem(STORAGE_KEY);
    };

    const enableTutorial = () => {
        setIsActive(true);
        // Remove skipped flag but keep completed steps
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                completed: Array.from(completedSteps),
                skipped: false
            })
        );
        // We don't force a step here; useTutorialTrigger will pick it up if relevant
    };

    return (
        <TutorialContext.Provider
            value={{
                isActive,
                currentStep,
                completedSteps,
                showStep,
                completeStep,
                closeStep,
                skipTutorial,
                resetTutorial,
                enableTutorial
            }}
        >
            {children}
            {currentStep && <TutorialPopup stepId={currentStep} />}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
    return ctx;
};

// Tutorial Popup Component
const TutorialPopup: React.FC<{ stepId: TutorialStepId }> = ({ stepId }) => {
    const { t } = useTranslation();
    const { completeStep, skipTutorial } = useTutorial();

    // Check if subtitle exists by checking translation return value or key existence
    const subtitle = t(`tutorial.${stepId}.subtitle`, { defaultValue: '' });

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
        >
            <div className="bg-slate-800 border border-green-500/50 rounded-lg p-6 max-w-md mx-4 shadow-2xl shadow-green-500/10">
                <div className="flex items-start gap-3 mb-4">
                    <Lightbulb className="text-green-400 shrink-0 mt-1" size={24} />
                    <div>
                        <h2
                            className="text-lg font-bold text-green-400 mb-1"
                            id="tutorial-title"
                            data-testid="tutorial-title"
                        >
                            {t(`tutorial.${stepId}.title`)}
                        </h2>
                        {subtitle && subtitle !== `tutorial.${stepId}.subtitle` && (
                            <p className="text-xs font-mono text-green-400/70 mb-3 uppercase tracking-wider">
                                {subtitle}
                            </p>
                        )}
                        <p
                            className="text-slate-300 text-sm leading-relaxed"
                            data-testid="tutorial-content"
                        >
                            {t(`tutorial.${stepId}.content`)}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
                    <button
                        onClick={skipTutorial}
                        className="text-slate-200 hover:text-white text-sm transition-colors underline decoration-slate-500 hover:decoration-white"
                        style={{ textUnderlineOffset: '4px' }}
                    >
                        {t('tutorial.skip')}
                    </button>
                    <button
                        onClick={() => completeStep(stepId)}
                        data-testid="tutorial-got-it"
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 font-bold px-4 py-2 rounded transition-colors shadow-lg shadow-green-900/20"
                    >
                        {t('tutorial.gotIt')} <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Hook to trigger tutorial step based on current phase
export const useTutorialTrigger = (phase: string) => {
    const { showStep, completedSteps, isActive, currentStep, closeStep } = useTutorial();

    useEffect(() => {
        // Validation: If current step doesn't match phase, close it
        if (currentStep) {
            const stepConfig = TUTORIAL_STEPS[currentStep];
            if (stepConfig.phase !== phase) {
                closeStep();
            }
        }

        if (!isActive) return;

        // Find the first incomplete step for this phase
        const stepsForPhase = Object.entries(TUTORIAL_STEPS)
            .filter(([_, step]) => step.phase === phase)
            .map(([id]) => id as TutorialStepId);

        const nextStep = stepsForPhase.find(id => !completedSteps.has(id));

        if (nextStep) {
            // Small delay for visual effect
            const timer = setTimeout(() => showStep(nextStep), 500);
            return () => clearTimeout(timer);
        }
    }, [phase, isActive, completedSteps, showStep, currentStep, closeStep]);
};
