import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface KeyboardHelpOverlayProps {
    onClose: () => void;
}

const shortcuts = [
    { keys: ['Space', 'Enter'], i18nKey: 'keyboardHelp.advance' },
    { keys: ['S'], i18nKey: 'keyboardHelp.ship' },
    { keys: ['1'], i18nKey: 'keyboardHelp.full' },
    { keys: ['2'], i18nKey: 'keyboardHelp.partial' },
    { keys: ['3'], i18nKey: 'keyboardHelp.none' },
    { keys: ['F'], i18nKey: 'keyboardHelp.toggle' },
    { keys: ['?', 'H'], i18nKey: 'keyboardHelp.help' },
    { keys: ['Esc'], i18nKey: 'keyboardHelp.close' }
];

export const KeyboardHelpOverlay: React.FC<KeyboardHelpOverlayProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        closeRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            role="dialog"
            aria-modal="true"
            aria-label={t('keyboardHelp.title')}
            onClick={handleBackdropClick}
            onKeyDown={e => {
                if (e.key === 'Escape') onClose();
            }}
        >
            <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-amber-500 uppercase tracking-wider">
                        {t('keyboardHelp.title')}
                    </h2>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        aria-label={t('keyboardHelp.close')}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    {shortcuts.map(({ keys, i18nKey }) => (
                        <div key={i18nKey} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{t(i18nKey)}</span>
                            <div className="flex gap-1">
                                {keys.map(key => (
                                    <kbd
                                        key={key}
                                        className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-xs text-amber-400 font-mono min-w-[2rem] text-center"
                                    >
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
