/**
 * Language Selector Component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { changeLanguage } from '../../../i18n';

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const toggleLanguage = () => {
        const newLang = currentLang.startsWith('es') ? 'en' : 'es';
        changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            data-testid="language-selector"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 rounded text-sm transition-colors"
            aria-label="Change Language"
            title={currentLang.startsWith('es') ? 'Switch to English' : 'Cambiar a Espanol'}
        >
            <Languages size={16} />
            <span className="uppercase font-mono">
                {currentLang.startsWith('es') ? 'ES' : 'EN'}
            </span>
        </button>
    );
};
