# PROJECT KNOWLEDGE BASE

**Generated:** Sun Jan 25 2026
**Commit:** N/A
**Branch:** N/A

## OVERVIEW
Chrome Extension (Manifest V3) for "알고고" (Algogo) - Korean algorithm platform submission automation targeting BOJ (acmicpc.net) and algogo.co.kr.

## STRUCTURE
```
.
├── src/
│   ├── background/    # Service worker: tab management, submission orchestration
│   ├── content/      # Content script: DOM manipulation, BOJ integration
│   ├── types/        # TypeScript type definitions
│   ├── constants/    # Message types & response codes
│   └── popup/       # Popup UI (NOT BUILT - commented out in webpack)
├── public/
│   ├── manifest.json  # Extension manifest V3
│   ├── popup.html    # Popup UI (references missing popup.js)
│   └── popup.css    # Popup styles
├── dist/            # Build output (background.js, content.js)
├── webpack.config.js  # Webpack bundler config
└── package.json      # pnpm project (type: "module")
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Entry points | webpack.config.js | background.ts, content.ts (popup.ts commented out) |
| Build system | webpack.config.js | Webpack 5, ts-loader, code splitting disabled |
| Type definitions | src/types/*.ts, *.d.ts | Mixed .ts/.d.ts conventions |
| Message passing | src/constants/messageTypes.ts | Manual type definitions, 106 lines |
| Tab management | src/background/background.ts | createAndWaitForTab(), waitForTabClose() |
| BOJ integration | src/content/boj.ts | DOM manipulation with fixed timeouts |
| Platform factory | src/background/factory.ts, src/content/factory.ts | Duplicate implementations |

## CODE MAP
LSP server not installed - skipping.

## CONVENTIONS

### Module System (INCONSISTENT)
- `package.json`: `"type": "module"` (ESM)
- `tsconfig.json`: `"module": "CommonJS"`
- **Issue**: Mismatch - resolve to one system

### Type Definitions
- Mixed extensions: `Submit.d.ts`, `Source.d.ts` (declarations) vs `Message.ts`, `Factory.ts` (implementations)
- **Pattern**: Decide on all .ts or all .d.ts

### Factory Pattern
- Separate factories in `background/factory.ts` and `content/factory.ts`
- **Issue**: Code duplication - consolidate to single factory

### Platform Integration
- Background: `boj.ts` (URL generation only)
- Content: `boj.ts` (DOM manipulation, submission, progress)
- **Pattern**: Platform code split by responsibility, not by file

### Message Types
- Manual `MessageType` object with string constants (not enums)
- Explicit `MessagePayloadMap` for type safety

## ANTI-PATTERNS (THIS PROJECT)

### Build Configuration
- Code splitting disabled (`splitChunks: false`) - Chrome extension requirement
- Filesystem caching disabled (`cache: false`) - intentional but unusual
- Commented-out popup entry point in webpack (line 20)

### DOM Manipulation
- Fixed timeout waits: `await new Promise(resolve => setTimeout(resolve, 2000))`
- **Risk**: Race conditions on slow systems, wasted time on fast systems

### Entry Points
- `index.html` references `/src/main.ts` (doesn't exist) - leftover Vite artifact
- `popup.html` references `popup.js` (not built) - popup.ts excluded from webpack

### Type Definitions
- Commented-out languages in `types/Language.d.ts` indicate deprecated support
- No explicit deprecation policy documented

## UNIQUE STYLES

### Tab Management
- Invisible tab operations: create tab, activate only when needed
- Original tab restoration after operations
- Duplicate listener prevention using `Map<number, Promise<never>>`

### Error Handling
- Korean error messages: ResponseCodeMessage uses Korean text
- Explicit error codes: 4-digit codes (0000-9999)
- Promise.race with tab closure timeout

### Source Language
- Comments in Korean: webpack.config.js, source files use Korean comments
- Korean UI: manifest name/description in Korean

## COMMANDS
```bash
pnpm run build    # Webpack production build
pnpm run dev      # Webpack watch mode for development
```

## NOTES
- **No test infrastructure**: No test files, frameworks, or CI/CD workflows
- **Package manager**: pnpm (lockfile version 9.0)
- **Target browsers**: Chrome (Manifest V3)
- **Permissions**: tabs, scripting
- **Host permissions**: acmicpc.net, localhost:5173, algogo.co.kr
- **Critical bug**: Popup script not built - fix by uncommenting line 20 in webpack.config.js
- **Clean up**: Remove unused index.html (Vite artifact)
