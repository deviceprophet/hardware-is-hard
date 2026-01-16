# Game Engine Architecture

This document describes the refactored architecture that separates the **game engine** from the **UI layer**.

## Overview

The game has been restructured into three distinct layers:

```
src/
  engine/              # Layer 1: Pure TypeScript game logic (NO dependencies)
    types.ts           # Core game types and interfaces
    constants.ts       # Game configuration
    condition-parser.ts # Event trigger condition evaluation
    GameEngine.ts      # Main engine class
    logic/             # Sub-layer: Pure computation utilities
      event-logic.ts   # Probability and weighting
      compliance-logic.ts # Maintenance and regulatory math
    data-provider.ts   # Data loading and validation
    index.ts           # Public API
    tests/             # Unit tests and simulation framework

  adapters/            # Layer 2: Framework bridges
    react/
      store.ts         # Zustand store wrapping engine
      useGameLoop.ts   # React hook for game timing
      index.ts

  components/game/     # Layer 3: React UI components
    views/             # View components
  data/                # Shared Game Data (JSON)

  components/game/     # Layer 3: React UI components
    views/             # View components
    GameContainer.tsx  # Main container
```

## Layer 1: Game Engine (`src/engine/`)

The core game engine is **completely framework-agnostic**. It has:

- **Zero dependencies** on React, Zustand, or any UI library
- **Pure functions** for all game logic
- **Immutable state snapshots** for predictable updates
- **Dependency injection** for testability

### Key Features

1. **Command Pattern**: All state mutations go through `dispatch(command)`:

    ```typescript
    engine.dispatch({ type: 'SELECT_DEVICE', deviceId: 'omni-juice' });
    engine.dispatch({ type: 'RESOLVE_CRISIS', choiceId: 'choice-1' });
    ```

2. **Observer Pattern**: Subscribe to state changes:

    ```typescript
    const unsubscribe = engine.subscribe(state => {
        console.log('Game state changed:', state.phase);
    });
    ```

3. **Seeded Random**: For deterministic testing:

    ```typescript
    const random = createSeededRandom(12345);
    const engine = new GameEngine(dataProvider, config, random);
    // This game will play exactly the same way every time
    ```

4. **Proper Condition Parsing**: Events can have conditions like `"month > 12"` or `"budget < 50000"` that are properly parsed and evaluated.

## Layer 2: Adapters (`src/adapters/`)

Adapters bridge the engine to specific UI frameworks.

### React Adapter

The React adapter provides:

- `useGameStore` - Zustand hook that wraps the engine
- `useGameLoop` - Hook that handles `requestAnimationFrame` timing

```typescript
import { useGameStore, useGameLoop } from '../../adapters/react';

const MyComponent = () => {
  const phase = useGameStore(state => state.phase);
  useGameLoop(); // Starts the game timer

  return <div>Current phase: {phase}</div>;
};
```

### Console Adapter (CLI Game)

The console adapter provides a complete terminal-based game experience:

```bash
# Play in your terminal
npm run play

# Or after publishing to npm
npx hardware-is-hard
```

Features:

- ANSI color output for visual appeal
- ASCII box drawing for UI elements
- Interactive prompts for choices
- Full game loop with all phases
- Same game mechanics as the web UI

```typescript
import { ConsoleGame } from './adapters/console';
import devicesData from './data/devices.json';
import eventsData from './data/events.json';

const game = new ConsoleGame(devicesData, eventsData);
await game.start();
```

### Future Adapters

The architecture supports adding new adapters:

- `adapters/vue/` - Vue.js adapter
- `adapters/web/` - Vanilla JS adapter
- `adapters/discord/` - Discord bot integration

## Testing

The project includes comprehensive tests:

### Unit Tests

```bash
npm test                    # Run all tests
npm test:watch              # Watch mode
npm test:coverage           # With coverage report
```

### Game Simulation Framework

The simulation framework runs thousands of games to analyze balance:

```bash
npm run test:simulation     # Run simulation tests
```

Output includes:

- Win/loss rates per device
- Event trigger frequency
- Choice impact analysis
- Balance score (0-100)
- Specific balance warnings

Example output:

```
BALANCE WARNING: Win rate is 100.0% - game may be too easy
BALANCE WARNING: All games same length - game needs more challenge
Event event_flash_shortage triggers in 100% of games
```

## Game Balance Insights

The simulation revealed the following balance issues to address:

1. **Win Rate**: 100% - game is currently too easy
2. **Event Triggers**: Some events trigger in 100% of games
3. **Game Length**: All games last exactly 60 months
4. **Unused Events**: `event_botnet` never triggers (requires tags no starter device has)

### Suggested Fixes

- Increase doom impact of choices
- Add more events with lower trigger thresholds
- Create events that chain (one event adds tags that enable others)
- Consider adding a "passive doom" that increases even without events
