// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import compress from 'astro-compress';
import { buildDefines } from './scripts/build-defines.mjs';

// https://astro.build/config
export default defineConfig({
    // Static output - no SSR, purely client-side
    output: 'static',

    integrations: [
        react(),
        compress({
            HTML: {
                'html-minifier-terser': {
                    removeComments: true,
                    ignoreCustomComments: [/^!/], // Preserve comments starting with !
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    minifyCSS: true,
                    minifyJS: true
                }
            },
            CSS: true,
            Image: true,
            JavaScript: true,
            SVG: true
        })
    ],

    // Set base to root for standard behavior
    base: '/',

    outDir: './dist',

    build: {
        // Use 'file' format to generate index.html instead of folders
        format: 'file'
    },

    vite: {
        // @ts-expect-error - tailwindcss vite plugin type mismatch
        plugins: [tailwindcss()],

        define: buildDefines,

        build: {
            assetsDir: '_astro',
            rollupOptions: {
                output: {
                    // Flatten all chunks into labs/_astro/ (no subdirectories)
                    chunkFileNames: chunkInfo => {
                        // Replace path separators to flatten astro/server -> astro-server
                        const name = chunkInfo.name.replace(/\//g, '-');
                        return `labs/_astro/${name}.[hash].js`;
                    },
                    entryFileNames: 'labs/_astro/[name].[hash].js',
                    assetFileNames: 'labs/_astro/[name].[hash][extname]'
                }
            }
        }
    }
});
