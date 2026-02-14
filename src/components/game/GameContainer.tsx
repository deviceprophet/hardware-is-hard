import React, { useEffect } from 'react';
import { useGameStore, useGameLoop } from '../../adapters/react';
import { useSoundEffects, useSound } from '../../adapters/audio';
import { ErrorBoundary } from '../ErrorBoundary';
import { Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { TutorialProvider, useTutorialTrigger, useTutorial } from './Tutorial';
import { LanguageSelector } from './ui/LanguageSelector';
import { Footer } from './ui/Footer';
import '../../i18n'; // Initialize i18n

// Views - lazy loaded for code splitting
// SplashView is eagerly loaded since it's the initial view
import { SplashView } from './views/SplashView';
const SetupView = React.lazy(() =>
    import('./views/SetupView').then(m => ({ default: m.SetupView }))
);
const SimulationView = React.lazy(() =>
    import('./views/SimulationView').then(m => ({ default: m.SimulationView }))
);
const CrisisView = React.lazy(() =>
    import('./views/CrisisView').then(m => ({ default: m.CrisisView }))
);
const AutopsyView = React.lazy(() =>
    import('./views/AutopsyView').then(m => ({ default: m.AutopsyView }))
);
const VictoryView = React.lazy(() =>
    import('./views/VictoryView').then(m => ({ default: m.VictoryView }))
);
const SharedResultView = React.lazy(() =>
    import('./views/SharedResultView').then(m => ({ default: m.SharedResultView }))
);

// Inner component with game logic
const GameContent: React.FC = () => {
    const phase = useGameStore(state => state.phase);
    const doomLevel = useGameStore(state => state.doomLevel);
    const loadFromUrl = useGameStore(state => state.loadFromUrl);

    // Check for shared game state in URL on mount
    useEffect(() => {
        if (phase === 'splash') {
            loadFromUrl();
        }
    }, []); // Only run once on mount

    // Initialize Loop & Sound
    useGameLoop();
    useSoundEffects();
    useTutorialTrigger(phase); // Trigger tutorial steps based on phase
    const { isMuted, toggleMute, playClick } = useSound();
    const { isActive, enableTutorial, skipTutorial, resetTutorial } = useTutorial();

    // Render logic based on phase
    const renderView = () => {
        switch (phase) {
            case 'splash':
                return <SplashView />;
            case 'setup':
                return <SetupView />;
            case 'simulation':
            case 'crisis': // Crisis overlays on simulation
                return (
                    <>
                        <SimulationView />
                        {phase === 'crisis' && <CrisisView />}
                    </>
                );
            case 'autopsy':
                return <AutopsyView />;
            case 'victory':
                return <VictoryView />;
            case 'shared_result':
                return <SharedResultView />;
            default:
                return <div className="text-red-500">Unknown Phase: {phase}</div>;
        }
    };

    return (
        <div
            className={`w-full min-h-screen md:h-screen overflow-y-auto md:overflow-hidden bg-slate-950 text-slate-100 relative font-sans transition-colors duration-1000 pb-10 ${
                doomLevel >= 80 ? 'animate-pulse-red' : ''
            }`}
            style={{ minHeight: '100dvh' }}
        >
            {renderView()}

            <aside className="contents">
                {/* Tutorial Toggle (Top Right) */}
                <button
                    onClick={() => {
                        playClick();
                        if (isActive) {
                            skipTutorial();
                        } else {
                            if (phase === 'splash') {
                                resetTutorial();
                            } else {
                                enableTutorial();
                            }
                        }
                    }}
                    className="fixed top-4 right-4 p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 transition-colors z-50 cursor-pointer border border-slate-700 hover:border-slate-500"
                    aria-label={isActive ? 'Disable Tutorial' : 'Enable Tutorial'}
                    title={isActive ? 'Disable Tutorial' : 'Enable Tutorial'}
                >
                    {isActive ? (
                        <HelpCircle size={20} className="text-green-400" />
                    ) : (
                        <HelpCircle
                            size={20}
                            className="text-slate-400 opacity-50 hover:opacity-100"
                        />
                    )}
                </button>

                {/* Mute Button */}
                <button
                    onClick={() => {
                        toggleMute();
                        playClick();
                    }}
                    className="fixed bottom-12 right-4 p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 transition-colors z-50 cursor-pointer border border-slate-700 hover:border-slate-500"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    data-testid="mute-btn"
                    title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                    {isMuted ? (
                        <VolumeX size={20} className="text-slate-400" />
                    ) : (
                        <Volume2 size={20} className="text-green-400" />
                    )}
                </button>

                {/* Language Selector */}
                <div className="fixed bottom-12 left-4 z-50">
                    <LanguageSelector />
                </div>

                {/* Footer */}
                <Footer />
            </aside>
        </div>
    );
};

// Main Export with Providers
export const GameContainer: React.FC = () => (
    <ErrorBoundary>
        <TutorialProvider>
            <React.Suspense
                fallback={
                    <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-green-500">
                        Loading Terminal...
                    </div>
                }
            >
                <GameContent />
            </React.Suspense>
        </TutorialProvider>
    </ErrorBoundary>
);
