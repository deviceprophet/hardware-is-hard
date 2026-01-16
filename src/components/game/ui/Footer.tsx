/**
 * Footer Component
 *
 * Global footer with copyright, links, and version info.
 * No translations needed - uses static English text.
 */

import React from 'react';

// Injected by Vite at build time
declare const __APP_VERSION__: string;
declare const __GIT_COMMIT__: string;

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
    const commit = typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'dev';

    return (
        <footer
            className="fixed bottom-0 left-0 right-0 py-2 px-4 text-xs text-center z-40"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderTop: '1px solid var(--border-default)',
                color: 'var(--text-secondary)'
            }}
        >
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <span>
                    © {currentYear}{' '}
                    <a
                        href="https://deviceprophet.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-green-400 transition-colors underline font-bold"
                        data-testid="footer-main-link"
                    >
                        Device Prophet
                    </a>
                    <span className="mx-2">•</span>
                    <span className="opacity-80">Simulation is fun. Compliance is hard.</span>
                </span>

                <span className="hidden sm:inline opacity-30">•</span>

                <a
                    href="https://deviceprophet.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 transition-colors underline opacity-80 hover:opacity-100"
                >
                    Privacy
                </a>

                <span className="hidden sm:inline opacity-30">•</span>

                <span className="opacity-80">
                    The Recall Run v{version} ({commit})
                </span>
                <span className="mx-1 opacity-80">-</span>
                <a
                    href="https://github.com/deviceprophet/hardware-is-hard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 transition-colors underline hover:opacity-100"
                >
                    GitHub (Feedback & Contributions Welcome)
                </a>
            </div>
        </footer>
    );
};
