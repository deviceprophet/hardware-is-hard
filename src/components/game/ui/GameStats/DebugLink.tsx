/**
 * Debug Link Component
 *
 * Subtle debug link for full state export.
 * Used by AutopsyView and VictoryView.
 */

import React, { useState } from 'react';

export interface DebugLinkProps {
    debugUrl: string;
    copiedLabel: string;
    defaultLabel: string;
}

export const DebugLink: React.FC<DebugLinkProps> = ({ debugUrl, copiedLabel, defaultLabel }) => {
    const [debugCopied, setDebugCopied] = useState(false);

    const handleCopyDebug = async () => {
        try {
            await navigator.clipboard.writeText(debugUrl);
            setDebugCopied(true);
            setTimeout(() => setDebugCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy debug URL:', err);
        }
    };

    return (
        <div
            className="border-t pt-4 w-full max-w-md"
            style={{ borderColor: 'var(--border-default)' }}
        >
            <button
                onClick={handleCopyDebug}
                className="text-xs transition-colors cursor-pointer opacity-50 hover:opacity-100"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label={defaultLabel}
            >
                <span className="flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                    </svg>
                    {debugCopied ? copiedLabel : defaultLabel}
                </span>
            </button>
        </div>
    );
};
