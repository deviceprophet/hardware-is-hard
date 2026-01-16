/**
 * Build-time defines for Vite
 *
 * Extracts version information from package.json and git.
 * These values are injected as global constants at build time.
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Read package.json for version
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Get short git commit hash
let gitCommit = 'unknown';
try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
    // Not a git repo or git not available
    console.warn('[build-defines] Could not get git commit hash');
}

/**
 * Vite define object for global constants
 */
export const buildDefines = {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_COMMIT__: JSON.stringify(gitCommit)
};
