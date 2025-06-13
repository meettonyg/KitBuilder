# Media Kit Builder: Phase 1 Refactoring

This branch contains the first phase of the comprehensive architectural refactoring for the Media Kit Builder plugin. The goal is to transform the codebase into a modern, maintainable, and extensible architecture.

## Phase 1 Implementation

Phase 1 focuses on setting up the foundational architecture:

1. **Module-Based Structure**: Replaced global namespace with proper ES modules
2. **Event System**: Implemented pub/sub pattern for component communication
3. **State Management**: Created centralized state with proper subscriptions
4. **Error Handling**: Added robust error tracking and reporting
5. **Component Schema System**: Defined strict schemas for component validation

## Directory Structure

```
MediaKitBuilder/
├── src/                 # Source code
│   ├── core/            # Core functionality
│   │   ├── builder.js   # Main builder class
│   │   ├── state.js     # State management
│   │   └── events.js    # Event system
│   ├── ui/              # UI components (Phase 2)
│   ├── components/      # Component definitions
│   │   ├── registry.js  # Component registry
│   │   ├── schemas/     # Component schemas
│   │   └── types/       # Component implementations
│   ├── adapters/        # Platform adapters (Phase 4)
│   ├── styles/          # CSS architecture
│   │   ├── base/        # Base styles
│   │   ├── components/  # Component styles
│   │   ├── themes/      # Theme definitions
│   │   └── variables.css # CSS variables
│   └── utils/           # Utilities
├── dist/                # Compiled output
├── tests/               # Test files
└── ... (other WordPress plugin files)
```

## Build System

We've implemented a Webpack-based build system:

- **Development**: `npm run dev` (watch mode)
- **Production**: `npm run build`
- **Testing**: `npm test` (not yet implemented)

## How to Use

1. Install dependencies:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

3. The compiled files will be in the `dist/` directory and are automatically loaded by WordPress.

## Core Classes

### Builder

The main entry point that coordinates all aspects of the builder:

```javascript
import { Builder } from './src/core/builder';

// Create and initialize builder
const builder = new Builder(config);
await builder.initialize();
```

### EventEmitter

Provides a pub/sub pattern for communication:

```javascript
import { EventEmitter } from './src/core/events';

const events = new EventEmitter();

// Subscribe to events
const unsubscribe = events.on('component-added', (data) => {
  console.log('Component added:', data);
});

// Emit events
events.emit('component-added', { id: '123', type: 'biography' });

// Unsubscribe
unsubscribe();
```

### StateManager

Manages application state with proper subscriptions:

```javascript
import { StateManager } from './src/core/state';

const state = new StateManager();

// Subscribe to state changes
state.subscribe((oldState, newState) => {
  console.log('State changed:', oldState, newState);
});

// Update state
state.setState({ selectedElement: '123' });

// Undo/redo
state.undo();
state.redo();
```

### ComponentRegistry

Manages component definitions and validation:

```javascript
import { ComponentRegistry } from './src/components/registry';

const registry = new ComponentRegistry(events);

// Register components
registry.register('biography', biographyDefinition);

// Create component
const component = registry.createComponent('biography', { 
  content: { text: 'My biography' } 
});

// Validate component
const validationResult = registry.validateComponent(component);
```

## Next Steps

- **Phase 2**: UI Component & Style Refactoring
- **Phase 3**: Backend Alignment
- **Phase 4**: Platform Adapters
- **Phase 5**: Testing & Optimization

## Best Practices

1. Always use ES modules (import/export)
2. Never modify state directly, use the state manager
3. Use events for component communication
4. Validate component data against schemas
5. Handle errors properly with the error manager
6. Use CSS modules for component styling
7. Write tests for new functionality

## Code Examples

See the example component implementation in `src/components/types/biography.js` for guidance on how to implement components using the new architecture.
