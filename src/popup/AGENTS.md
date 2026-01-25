# POPUP KNOWLEDGE BASE

## OVERVIEW
User interface for the extension popup, currently a skeleton implementation for testing submission orchestration.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Logic | src/popup/popup.ts | DOM events and message passing (currently uses window.postMessage) |
| Layout | public/popup.html | Static HTML with inline styles and boilerplate content |
| Styling | public/popup.css | Basic dimensions (300px width) |

## CONVENTIONS
- **Message Passing**: Currently uses `window.postMessage` for internal testing, which is an anti-pattern for Chrome Extension popups (should use `chrome.runtime.sendMessage`).
- **UI State**: No state management implemented; direct DOM manipulation via `document.getElementById`.

## ANTI-PATTERNS
- **Broken Build**: Entry point is commented out in `webpack.config.js`.
- **Incorrect Messaging**: Uses `window.postMessage` instead of `chrome.runtime` APIs for background communication.
- **Inline Styles**: `popup.html` contains significant inline CSS despite having a separate `popup.css`.
- **Dead References**: References `popup.js` in HTML, but the source is `popup.ts` and it is not being bundled.
- **Hardcoded Tests**: `popup.ts` contains hardcoded BOJ problem 1000 submission logic for testing.
