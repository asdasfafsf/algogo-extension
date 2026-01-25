# BACKGROUND KNOWLEDGE BASE

## OVERVIEW
Service worker orchestrating tab management, platform-specific URL generation, and message passing between content scripts.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Message Handling | `background.ts` | Main `chrome.runtime.onMessage` listener and orchestration logic |
| Tab Lifecycle | `background.ts` | `createAndWaitForTab`, `waitForTabClose`, and `sendMessageToTab` |
| Platform Logic | `boj.ts` | URL generation for BOJ (acmicpc.net) |
| Factory Pattern | `factory.ts` | Platform instance resolver |

## CONVENTIONS
- **Tab Safety**: Always use `Promise.race` with `waitForTabClose(tabId)` when communicating with new tabs to prevent hanging on manual tab closure.
- **Invisible Operations**: New tabs are created with `active: false`. Only activate (`chrome.tabs.update`) if user interaction (like login) is required.
- **State Restoration**: Store the `originalTab` before opening new ones to restore focus after background tasks complete.
- **Listener Management**: Use `registeredTabIds` (Map) in `waitForTabClose` to prevent duplicate `onRemoved` listeners for the same tab.

## ANTI-PATTERNS
- **Duplicate Factory**: This directory contains a `factory.ts` that duplicates logic found in `src/content/factory.ts`.
- **Polling Logic**: `waitUntil` uses `setInterval`-style polling (500ms) to check for state changes in content scripts.
- **Error Handling**: Catch blocks often check for specific string matches in `error.message` (e.g., "Could not establish connection") rather than using structured error types.
- **Hardcoded Timeouts**: Default timeouts (5s for messages, 30s for login/submission) are hardcoded in function signatures.
