# CONSTANTS KNOWLEDGE BASE

## OVERVIEW
Centralized message type definitions and response codes for cross-context communication (Web <-> Content Script <-> Background).

## WHERE TO LOOK
| File | Purpose |
|------|---------|
| `messageTypes.ts` | Source of truth for all message IDs, response codes, and Korean error messages. |

## CONVENTIONS

### Message Naming
- Format: `[SOURCE]_TO_[DESTINATION]_[ACTION]`
- Contexts: `WEB`, `CONTENT_SCRIPT`, `BACKGROUND`, `NEW_CONTENT_SCRIPT`
- All definitions use `as const` for literal type inference.

### Response Codes
- **0000**: Success
- **9000-9004**: Operational errors (Unsupported code/source, Login/Submit failure)
- **9997-9999**: System/Lifecycle errors (Timeout, Tab closed, Unknown)

### Data Structures
- `ResponseCodeMessage`: Maps codes to user-facing Korean strings.
- `ResponseCodePair`: Combines code and message into a standard response object.

## ANTI-PATTERNS
- **Manual String Constants**: Uses string literals instead of TypeScript `enum`.
- **Redundant Mapping**: `ResponseCodePair` manually maps every code from `ResponseCode` and `ResponseCodeMessage` instead of using a dynamic generator or utility type.
- **Inconsistent Prefix**: `CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT` value is prefixed with `WEB_` (line 7), likely a copy-paste error.
