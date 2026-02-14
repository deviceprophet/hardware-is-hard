# AGENTS.md

This file provides guidance for AI assistants working with code in this repository.

## Project Overview

**The Recall Run** — a browser-based IoT survival simulation game. Players pick an IoT device archetype, face crises driven by their architectural decisions (tag-based event system), and try to survive 5 years without getting hacked, banned, or bankrupted. Pure client-side; no backend.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Astro dev server (http://localhost:4321/labs/)
pnpm build            # Build Astro site to ./dist
pnpm build:all        # Build site + CLI
pnpm test             # Run all Vitest unit tests
pnpm test:watch       # Vitest in watch mode
pnpm test:coverage    # Unit tests with coverage
pnpm test:simulation  # Game balance simulation (verbose)
pnpm lint             # ESLint
pnpm typecheck        # TypeScript type checking (tsc --noEmit)
pnpm format           # Prettier format all files
npx playwright test   # Run E2E tests (auto-starts dev server)
pnpm play             # Play CLI version in terminal
```

Run a single unit test file: pnpm vitest run path/to/file.test.ts
Run a single E2E test: npx playwright test tests/some.spec.ts

## Tech Stack

Astro 5 + React 19 + TypeScript 5.9 + Tailwind CSS 4 + Zustand 5. JEXL for condition parsing. lz-string for URL state compression (sharing). Deployed to Cloudflare Workers via Wrangler.

## Architecture

Three-layer architecture with strict dependency direction: Engine → Adapters → UI.

### Layer 1: Engine (src/engine/)

Framework-agnostic pure TypeScript with zero UI dependencies. All game logic lives here.

- GameEngine.ts — Core class. Command pattern: all mutations via dispatch(). Observer pattern for subscriptions.
- types.ts — All interfaces. Defines game phases and valid transitions.
- constants.ts — Game config (60 months, 10 events, $100K starting budget).
- condition-parser.ts — Evaluates JEXL expressions for event triggers.
- event-processor.ts — Filters events by required/blocked tags and conditions.
- logic/ — Pure computation modules (event-logic.ts, compliance-logic.ts).
- state-manager.ts — Immutable state snapshots.
- random.ts — Default and seeded RNG providers.
- data-provider.ts — Loads/validates game data with Zod schemas.

New game logic goes in src/engine/logic/, not in GameEngine.ts directly.

### Layer 2: Adapters (src/adapters/)

Bridge engine to frameworks:

- react/ — Zustand store wrapping GameEngine, game loop hook.
- console/ — Terminal CLI game using the same engine.
- audio/ — Howler.js sound manager.
- text/ — Text rendering utilities.

### Layer 3: UI (src/components/)

React components organized by game phase in components/game/views/. Entry point is GameContainer.tsx.

### Entry Points

- Web: src/pages/labs/index.astro — Astro page loading React GameContainer (base path: /labs/)
- CLI: src/cli.ts — Terminal game via ConsoleGame adapter

## Game Data (src/data/)

- devices.json — 7 IoT device archetypes with difficulty, initial tags, budget.
- events.json — 68+ events with required/blocked tags, JEXL trigger conditions, choices.
- Tags (e.g., vulnerable_wifi, legacy_code) are the core mechanic: events require/block on tags, player choices add/remove tags.
- When adding new enum values, update both src/engine/types.ts and Zod schemas in src/engine/data-provider.ts.

## Localization (src/locales/)

i18next with English and Spanish. Two files per locale: translation.json (UI) and content.json (game content). Config in src/i18n.ts. Adding a new locale requires: creating the folder, both JSON files, and registering in src/i18n.ts.

## Testing

- Unit tests (Vitest): .test.ts/.test.tsx extension. Located in src/engine/tests/, src/adapters/tests/, src/components/game/ui/tests/, src/utils/tests/. Test helpers in factories.ts. Property-based tests use fast-check.
- E2E tests (Playwright): .spec.ts extension in tests/. Runs against Chromium, Firefox, WebKit.
- Balance simulation: src/engine/tests/simulation.test.ts — Runs thousands of games to check balance. Run after editing game data.

Important: Unit tests are .test.ts, E2E tests are .spec.ts. Using the wrong extension causes tests to be silently skipped.

## Code Style

- Prettier: 100 char width, 4-space indent, single quotes, no trailing commas, semicolons
- ESLint: TypeScript recommended + React + Astro plugins
- Unused variables prefixed with \_ (warning, not error)
- TypeScript strict mode (extends astro/tsconfigs/strict)
