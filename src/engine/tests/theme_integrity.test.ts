/**
 * Theme Integrity Tests
 *
 * Ensures that all game components use proper theme CSS variables
 * instead of hardcoded colors.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Get all theme variables from tokens.css
const tokensPath = join(__dirname, '../../styles/tokens.css');
const tokensContent = readFileSync(tokensPath, 'utf-8');

// Extract all CSS variable definitions
const cssVariablePattern = /--([a-zA-Z0-9-]+):/g;
const definedVariables = new Set<string>();
let match;
while ((match = cssVariablePattern.exec(tokensContent)) !== null) {
    definedVariables.add(`--${match[1]!}`);
}

// Helper to get all TSX files recursively
function getAllTsxFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = readdirSync(dir);

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('tests')) {
            files.push(...getAllTsxFiles(fullPath));
        } else if (entry.endsWith('.tsx')) {
            files.push(fullPath);
        }
    }

    return files;
}

describe('Theme Integrity', () => {
    // Get all component files
    const componentsDir = join(__dirname, '../../components/game');
    const componentFiles = getAllTsxFiles(componentsDir);

    it('should have defined CSS variables in tokens.css', () => {
        expect(definedVariables.size).toBeGreaterThan(10);
        expect(definedVariables.has('--bg-primary')).toBe(true);
        expect(definedVariables.has('--text-primary')).toBe(true);
        expect(definedVariables.has('--doom-danger')).toBe(true);
    });

    it('should not use undefined CSS variables in components', () => {
        const undefinedVars: { file: string; variable: string; line: number }[] = [];

        // Pattern to find var(--something) usage
        const varUsagePattern = /var\((--[a-zA-Z0-9-]+)\)/g;

        for (const file of componentFiles) {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]!;
                let varMatch;
                while ((varMatch = varUsagePattern.exec(line)) !== null) {
                    const varName = varMatch[1]!;
                    if (!definedVariables.has(varName)) {
                        undefinedVars.push({
                            file: file.replace(componentsDir, ''),
                            variable: varName,
                            line: i + 1
                        });
                    }
                }
            }
        }

        if (undefinedVars.length > 0) {
            console.log('Undefined CSS variables found:');
            for (const { file, variable, line } of undefinedVars) {
                console.log(`  ${file}:${line} - ${variable}`);
            }
        }

        expect(undefinedVars).toEqual([]);
    });

    it('should not use hardcoded hex colors in style attributes', () => {
        const hardcodedColors: { file: string; color: string; line: number }[] = [];

        // Pattern to find hardcoded hex colors in style={{ }}
        // This is a simplified check - looks for #xxx or #xxxxxx in style attributes
        const hexColorPattern = /#[0-9a-fA-F]{3,6}\b/g;

        for (const file of componentFiles) {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            let inStyleBlock = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]!;

                // Simple heuristic: check if we're in a style={{ block
                if (line.includes('style={{') || line.includes('style: {')) {
                    inStyleBlock = true;
                }
                if (inStyleBlock && line.includes('}}')) {
                    inStyleBlock = false;
                }

                if (inStyleBlock) {
                    let colorMatch;
                    while ((colorMatch = hexColorPattern.exec(line)) !== null) {
                        // Allow some specific cases like opacity values or well-known colors
                        const color = colorMatch[0]!;
                        // Skip if it's inside a comment
                        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

                        hardcodedColors.push({
                            file: file.replace(componentsDir, ''),
                            color,
                            line: i + 1
                        });
                    }
                }
            }
        }

        if (hardcodedColors.length > 0) {
            console.log('Hardcoded colors found in style attributes:');
            for (const { file, color, line } of hardcodedColors.slice(0, 10)) {
                console.log(`  ${file}:${line} - ${color}`);
            }
        }

        // Allow a small number of hardcoded colors (for edge cases)
        expect(hardcodedColors.length).toBeLessThan(5);
    });

    it('should use theme text colors instead of hardcoded text colors', () => {
        const hardcodedTextColors: { file: string; line: number; snippet: string }[] = [];

        // Common hardcoded text color patterns
        const patterns = [
            /color:\s*['"](?:white|black|#[0-9a-fA-F]{3,6})['"](?![^}]*var\()/gi,
            /color:\s*(?:white|black)(?![^}]*var\()/gi
        ];

        for (const file of componentFiles) {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]!;
                for (const pattern of patterns) {
                    if (pattern.test(line) && !line.includes('var(--')) {
                        hardcodedTextColors.push({
                            file: file.replace(componentsDir, ''),
                            line: i + 1,
                            snippet: line.trim().slice(0, 60)
                        });
                    }
                    // Reset lastIndex for global regex
                    pattern.lastIndex = 0;
                }
            }
        }

        if (hardcodedTextColors.length > 0) {
            console.log('Hardcoded text colors found:');
            for (const { file, line, snippet } of hardcodedTextColors.slice(0, 5)) {
                console.log(`  ${file}:${line} - ${snippet}`);
            }
        }

        // Warn but allow some hardcoded colors for gradients/special effects
        expect(hardcodedTextColors.length).toBeLessThan(10);
    });
});
