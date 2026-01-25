# CONTENT SCRIPT KNOWLEDGE BASE

## OVERVIEW
Main entry point for DOM manipulation and platform-specific automation (BOJ) injected into web pages.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Message Routing | `content.ts` | Handles `chrome.runtime` (background) and `window.postMessage` (web) |
| BOJ Automation | `boj.ts` | DOM selectors, CodeMirror injection, and status scraping |
| Instance Factory | `factory.ts` | Maps platform sources (e.g., 'BOJ') to implementation objects |

## CONVENTIONS

### Message Handling
- **Dual Listeners**: Listens to both extension messages and web page messages.
- **Response Pattern**: Uses `sendResponse` for runtime messages and `postMessage` for web events.

### DOM Manipulation (BOJ)
- **CodeMirror Injection**: Targets the hidden textarea within CodeMirror containers.
- **Event Dispatching**: Manual `change`, `input`, and `chosen:updated` events are required after value updates.
- **Status Scraping**: Parses the status table (`table.table td.result`) to track grading progress.

## ANTI-PATTERNS

### Synchronization
- **Hardcoded Timeouts**: Uses `setTimeout(resolve, 2000)` and `1500` for DOM sync.
- **Risk**: Brittle on slow networks or heavy pages; prefer MutationObserver or element polling.

### Error Handling
- **Silent Fails**: `submit()` returns `false` on any error without logging specific failure reasons.
- **Selector Fragility**: Direct dependency on BOJ's specific ID/class names (`#language`, `#source`, `.result-ac`).
