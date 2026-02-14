/**
 * Share Buttons Component
 *
 * Social sharing buttons for game end screens.
 * Used by AutopsyView and VictoryView.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTwitterShareUrl, getLinkedInShareUrl } from '@/utils/social';
import { SHARE } from '@/config/constants';

export interface ShareButtonsProps {
    shareText: string;
    resultUrl: string;
    shareLabel: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ shareText, resultUrl, shareLabel }) => {
    const { t } = useTranslation();
    const [resultCopied, setResultCopied] = useState(false);

    const twitterUrl = getTwitterShareUrl(shareText, resultUrl, SHARE.HASHTAGS);
    const linkedInUrl = getLinkedInShareUrl(shareText, resultUrl, SHARE.HASHTAGS);

    const handleCopyResultUrl = async () => {
        try {
            await navigator.clipboard.writeText(resultUrl);
            setResultCopied(true);
            setTimeout(() => setResultCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy result URL:', err);
        }
    };

    return (
        <div className="flex gap-3 flex-wrap justify-center mb-4">
            <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg hover:scale-105"
                style={{ backgroundColor: '#1DA1F2' }}
                aria-label="Share on Twitter"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>{shareLabel}</span>
            </a>
            <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg hover:scale-105"
                style={{ backgroundColor: '#0A66C2' }}
                aria-label="Share on LinkedIn"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span>{t('common.share')}</span>
            </a>
            <button
                onClick={handleCopyResultUrl}
                className="flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg hover:scale-105"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                aria-label="Copy result URL"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                </svg>
                <span>{resultCopied ? t('common.urlCopied') : t('common.copyUrl')}</span>
            </button>
        </div>
    );
};
