import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useGameStore } from '../../../adapters/react';
import { generateBlame } from '../../../engine/blame-generator';
import { formatGameDate, formatBudget } from '../../../utils';
import eventsData from '../../../data/events.json';
import type { GameEvent } from '../../../engine/types';

import { useTranslation } from 'react-i18next';
import { useTranslatedDevice } from '../../../hooks/useTranslatedContent';
import { SHARE } from '../../../config/constants';

/**
 * Autopsy View - Displayed when device fails (recall)
 *
 * Features:
 * - Final stats display (Budget, Compliance, Doom)
 * - Blame attribution for humorous failure diagnosis
 * - Social sharing buttons with lightweight result URLs
 * - Subtle debug link for full state export
 */
export const AutopsyView: React.FC = () => {
    const { t } = useTranslation();
    const reset = useGameStore(state => state.reset);
    const resultUrl = useGameStore(state => state.getResultUrl('recall'));
    const debugUrl = useGameStore(state => state.getShareUrl());
    const timelineMonth = useGameStore(state => state.timelineMonth);
    const selectedDevice = useGameStore(state => state.selectedDevice);
    const doomLevel = useGameStore(state => state.doomLevel);
    const budget = useGameStore(state => state.budget);
    const complianceLevel = useGameStore(state => state.complianceLevel);
    const history = useGameStore(state => state.history);
    const retryButtonRef = useRef<HTMLButtonElement>(null);
    const [debugCopied, setDebugCopied] = useState(false);
    const [resultCopied, setResultCopied] = useState(false);

    const translatedDevice = useTranslatedDevice(selectedDevice?.id || '');
    const deviceName = translatedDevice.name || selectedDevice?.name || 'Unknown Device';

    // Generate blame based on history
    const blame = useMemo(() => {
        return generateBlame(
            [...history],
            eventsData as GameEvent[],
            Math.round(timelineMonth * 1000)
        );
    }, [history, timelineMonth]);

    // Color coding for stats
    const getBudgetColor = () => {
        if (budget <= 0) return 'var(--doom-danger)';
        const initial = selectedDevice?.initialBudget || 100000;
        if (budget >= initial * 0.5) return 'var(--doom-warning)';
        return 'var(--doom-danger)';
    };

    const getComplianceColor = () => {
        if (complianceLevel >= 70) return 'var(--doom-safe)';
        if (complianceLevel >= 40) return 'var(--doom-warning)';
        return 'var(--doom-danger)';
    };

    const getDoomColor = () => {
        if (doomLevel >= 100) return 'var(--doom-danger)';
        if (doomLevel >= 60) return 'var(--doom-danger)';
        return 'var(--doom-warning)';
    };

    useEffect(() => {
        retryButtonRef.current?.focus();
    }, []);

    const blameText = `${blame.emoji} ${t(`blame.departments.${blame.department}`)} ${t(
        `blame.statements.${blame.department}.${blame.statement}`
    )}`;

    const shareText = t('autopsy.shareTemplate', {
        device: deviceName,
        duration: formatGameDate(timelineMonth),
        blame: blameText,
        budget: formatBudget(budget),
        doom: Math.round(doomLevel)
    });

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
    )}&url=${encodeURIComponent(resultUrl)}&hashtags=${SHARE.HASHTAGS.join(',')}`;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        resultUrl
    )}`;

    const handleCopyDebug = async () => {
        try {
            await navigator.clipboard.writeText(debugUrl);
            setDebugCopied(true);
            setTimeout(() => setDebugCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy debug URL:', err);
        }
    };

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
        <div
            className="h-full w-full overflow-y-auto"
            style={{ backgroundColor: 'rgba(247, 118, 142, 0.1)' }}
        >
            <div
                className="min-h-full flex flex-col items-center justify-center text-white p-8 text-center"
                style={{ fontFamily: 'var(--font-mono)' }}
                role="alertdialog"
                aria-labelledby="autopsy-title"
                aria-describedby="autopsy-desc"
                data-testid="autopsy-view"
            >
                {/* Title */}
                <h1
                    id="autopsy-title"
                    className="text-5xl md:text-6xl font-black mb-2 tracking-tighter animate-pulse"
                    style={{ color: 'var(--doom-danger)' }}
                >
                    {t('autopsy.title')}
                </h1>
                <p
                    id="autopsy-desc"
                    className="text-lg mb-4 max-w-md"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {t('autopsy.gameOver')}
                </p>

                {/* Blame Statement */}
                <div
                    className="mb-4 px-4 py-3 rounded-lg max-w-md"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--doom-danger)',
                        boxShadow: '0 0 20px rgba(247, 118, 142, 0.2)'
                    }}
                >
                    <p className="text-sm" style={{ color: 'var(--doom-warning)' }}>
                        <span className="font-bold">
                            {t(`blame.departments.${blame.department}`)}
                        </span>{' '}
                        {t(`blame.statements.${blame.department}.${blame.statement}`)}
                    </p>
                </div>

                {/* Final Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4 w-full max-w-md">
                    <div
                        className="p-3 rounded-lg text-center"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <div
                            className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {t('common.budget')}
                        </div>
                        <div className="text-xl font-bold" style={{ color: getBudgetColor() }}>
                            {formatBudget(budget)}
                        </div>
                    </div>
                    <div
                        className="p-3 rounded-lg text-center"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <div
                            className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {t('common.compliance')}
                        </div>
                        <div className="text-xl font-bold" style={{ color: getComplianceColor() }}>
                            {Math.round(complianceLevel)}%
                        </div>
                    </div>
                    <div
                        className="p-3 rounded-lg text-center"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)'
                        }}
                    >
                        <div
                            className="text-xs uppercase tracking-wider mb-1"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {t('common.doom')}
                        </div>
                        <div className="text-xl font-bold" style={{ color: getDoomColor() }}>
                            {Math.round(doomLevel)}%
                        </div>
                    </div>
                </div>

                {/* Device & Duration */}
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {deviceName} | {formatGameDate(timelineMonth)}
                </p>

                {/* Share Buttons */}
                <div className="flex gap-3 flex-wrap justify-center mb-4">
                    <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg"
                        style={{ backgroundColor: '#1DA1F2' }}
                        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                        aria-label="Share on Twitter"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>Share Failure</span>
                    </a>
                    <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg"
                        style={{ backgroundColor: '#0A66C2' }}
                        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                        aria-label="Share on LinkedIn"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span>Share</span>
                    </a>
                    <button
                        onClick={handleCopyResultUrl}
                        className="flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                        aria-label="Copy result URL"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
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

                {/* Try Again Button */}
                <button
                    ref={retryButtonRef}
                    onClick={reset}
                    className="px-8 py-3 font-bold text-lg rounded-lg transition-all cursor-pointer shadow-lg mb-8"
                    style={{
                        backgroundColor: 'var(--text-primary)',
                        color: 'var(--bg-primary)'
                    }}
                    onMouseOver={e => (e.currentTarget.style.filter = 'brightness(0.9)')}
                    onMouseOut={e => (e.currentTarget.style.filter = 'brightness(1)')}
                    aria-label={t('autopsy.tryAgain')}
                    data-testid="retry-btn"
                >
                    {t('autopsy.tryAgain')}
                </button>

                {/* Subtle Debug Link */}
                <div
                    className="border-t pt-4 w-full max-w-md"
                    style={{ borderColor: 'var(--border-default)' }}
                >
                    <button
                        onClick={handleCopyDebug}
                        className="text-xs transition-colors cursor-pointer opacity-50 hover:opacity-100"
                        style={{ color: 'var(--text-tertiary)' }}
                        aria-label="Copy debug state for bug reports"
                    >
                        <span className="flex items-center justify-center gap-1">
                            <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                />
                            </svg>
                            {debugCopied
                                ? 'Debug state copied!'
                                : 'Copy debug state for bug reports'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
