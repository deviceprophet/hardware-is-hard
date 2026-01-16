import { describe, it, expect } from 'vitest';
import { SOUND_CONFIGS } from '../SoundManager';
import fs from 'fs';
import path from 'path';

describe('Sound Assets Integrity', () => {
    const PUBLIC_DIR = path.resolve(__dirname, '../../../../public');

    it('should have all configured sound files present in public directory', () => {
        const missingFiles: string[] = [];

        Object.entries(SOUND_CONFIGS).forEach(([key, config]) => {
            // We check if AT LEAST ONE of the formats exists for each sound
            // Browsers usually need one valid format, but we prefer .ogg
            const hasValidSource = config.src.some(relPath => {
                const fullPath = path.join(PUBLIC_DIR, relPath);
                return fs.existsSync(fullPath);
            });

            if (!hasValidSource) {
                missingFiles.push(`${key}: ${config.src.join(' or ')}`);
            }
        });

        if (missingFiles.length > 0) {
            throw new Error(`Missing sound files:\n${missingFiles.join('\n')}`);
        }
    });

    it('should prefer .ogg format for all sounds', () => {
        const missingOgg: string[] = [];

        Object.entries(SOUND_CONFIGS).forEach(([key, config]) => {
            const oggPath = config.src.find(p => p.endsWith('.ogg'));
            if (!oggPath) {
                missingOgg.push(key);
                return;
            }

            const fullPath = path.join(PUBLIC_DIR, oggPath);
            if (!fs.existsSync(fullPath)) {
                missingOgg.push(`${key} (${oggPath})`);
            }
        });

        expect(missingOgg, 'All sounds should have an .ogg version').toEqual([]);
    });
});
