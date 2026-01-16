import { describe, test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Project Structure', () => {
    test('Should not have __tests__ folders anywhere', async () => {
        const rootDir = process.cwd();

        // Helper to recursively find folders
        const findForbiddenFolders = (dir: string, forbidden: string): string[] => {
            let results: string[] = [];
            const list = fs.readdirSync(dir);

            for (const file of list) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (
                        file === 'node_modules' ||
                        file === '.git' ||
                        file === 'dist' ||
                        file === '.astro'
                    ) {
                        continue;
                    }
                    if (file === forbidden) {
                        results.push(fullPath);
                    } else {
                        results = results.concat(findForbiddenFolders(fullPath, forbidden));
                    }
                }
            }
            return results;
        };

        const forbiddenFolders = findForbiddenFolders(rootDir, '__tests__');

        if (forbiddenFolders.length > 0) {
            console.error('Found forbidden __tests__ folders:', forbiddenFolders);
        }

        expect(forbiddenFolders).toHaveLength(0);
    });
});
