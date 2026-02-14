import eslintPluginAstro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

export default [
    // Global ignore
    {
        ignores: [
            'dist/**',
            '.astro/**',
            'node_modules/**',
            'coverage/**',
            '.stryker-tmp/**',
            'reports/**'
        ]
    },

    // TypeScript & Javascript
    ...tseslint.configs.recommended,

    // React
    {
        files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
        ...reactPlugin.configs.flat.recommended,
        settings: {
            react: {
                version: 'detect'
            }
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        rules: {
            'react/react-in-jsx-scope': 'off', // Not needed in Astro/Vite
            'react/prop-types': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ]
        }
    },

    // JSX Accessibility
    {
        files: ['**/*.{jsx,tsx}'],
        ...jsxA11y.flatConfigs.recommended
    },

    // Astro
    ...eslintPluginAstro.configs.recommended,
    {
        files: ['**/*.astro'],
        rules: {
            // Add any specific Astro overrides here
        }
    }
];
