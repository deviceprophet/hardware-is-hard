/**
 * ShareSection Component
 *
 * Extracted share functionality for result screens (Victory/Autopsy).
 * Handles Twitter, LinkedIn, and clipboard sharing.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SHARE } from '../../../config/constants';

// Twitter/X Icon
const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// LinkedIn Icon
const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

// Copy/Clipboard Icon
const CopyIcon: React.FC<{ className?: string; copied?: boolean }> = ({ className, copied }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        ) : (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
        )}
    </svg>
);

interface ShareSectionProps {
    /** The share text for the tweet */
    shareText: string;
    /** The URL to share (result page) */
    resultUrl: string;
    /** Optional debug URL for developers */
    debugUrl?: string;
    /** Button label for Twitter (e.g., "Share Victory" or "Share Failure") */
    twitterLabel?: string;
    /** Hashtags to append (without #) */
    hashtags?: string[];
}

export const ShareSection: React.FC<ShareSectionProps> = ({
    shareText,
    resultUrl,
    debugUrl,
    twitterLabel = 'Share',
    hashtags = SHARE.HASHTAGS
}) => {
    const { t } = useTranslation();
    const [resultCopied, setResultCopied] = useState(false);
    const [debugCopied, setDebugCopied] = useState(false);

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
    )}&url=${encodeURIComponent(resultUrl)}&hashtags=${hashtags.join(',')}`;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        resultUrl
    )}`;

    const handleCopyResultUrl = async () => {
        try {
            await navigator.clipboard.writeText(resultUrl);
            setResultCopied(true);
            setTimeout(() => setResultCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy result URL:', err);
        }
    };

    const handleCopyDebug = async () => {
        if (!debugUrl) return;
        try {
            await navigator.clipboard.writeText(debugUrl);
            setDebugCopied(true);
            setTimeout(() => setDebugCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy debug URL:', err);
        }
    };

    const buttonClass =
        'flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg';

    const handleHover = (e: React.MouseEvent<HTMLElement>, scale: string) => {
        e.currentTarget.style.transform = scale;
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Main Share Buttons */}
            <div className="flex gap-4 flex-wrap justify-center">
                {/* Twitter/X */}
                <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass}
                    style={{ backgroundColor: '#1DA1F2' }}
                    onMouseOver={e => handleHover(e, 'scale(1.05)')}
                    onMouseOut={e => handleHover(e, 'scale(1)')}
                    aria-label="Share on Twitter"
                >
                    <TwitterIcon className="w-5 h-5" />
                    <span>{twitterLabel}</span>
                </a>

                {/* LinkedIn */}
                <a
                    href={linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass}
                    style={{ backgroundColor: '#0A66C2' }}
                    onMouseOver={e => handleHover(e, 'scale(1.05)')}
                    onMouseOut={e => handleHover(e, 'scale(1)')}
                    aria-label="Share on LinkedIn"
                >
                    <LinkedInIcon className="w-5 h-5" />
                    <span>Share</span>
                </a>

                {/* Copy URL */}
                <button
                    onClick={handleCopyResultUrl}
                    className={buttonClass}
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    onMouseOver={e => handleHover(e, 'scale(1.05)')}
                    onMouseOut={e => handleHover(e, 'scale(1)')}
                    aria-label="Copy result URL"
                >
                    <CopyIcon className="w-5 h-5" copied={resultCopied} />
                    <span>{resultCopied ? t('common.urlCopied') : t('common.copyUrl')}</span>
                </button>
            </div>

            {/* Debug URL (optional, for developers) */}
            {debugUrl && (
                <button
                    onClick={handleCopyDebug}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity underline"
                    aria-label="Copy debug URL"
                >
                    {debugCopied ? 'Debug URL Copied!' : 'Copy Debug URL'}
                </button>
            )}
        </div>
    );
};

export default ShareSection;
