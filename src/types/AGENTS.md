# TYPES KNOWLEDGE BASE

## OVERVIEW
Central hub for TypeScript definitions, bridging message passing, platform factories, and submission data structures.

## WHERE TO LOOK
| Type | File | Description |
|------|------|-------------|
| Messaging | `Message.ts` | `MessagePayloadMap` and `ResponseMessageMap` for type-safe communication |
| Platform | `Factory.ts` | `Factory` interface for platform-specific automation methods |
| Submission | `Submit.d.ts` | Core submission data structure (code, language, source) |
| Constants | `Language.d.ts`, `Source.d.ts` | Enums/Unions for supported platforms and languages |
| API | `Response.d.ts` | Generic wrapper for API/Message responses |

## CONVENTIONS
- **Mixed Extensions**: `.d.ts` for pure ambient declarations, `.ts` for types that import from constants or require runtime logic.
- **Message Mapping**: Uses `MessagePayloadMap` indexed by `MessageType` constants to ensure payload consistency across the extension.
- **Platform Factory**: The `Factory` type is a mapped type over `Source`, forcing all platforms to implement the same automation interface.

## ANTI-PATTERNS
- **Inconsistent Extensions**: Mixing `.ts` and `.d.ts` for similar purposes (e.g., `Source.d.ts` vs `Message.ts`).
- **Commented-out Types**: `Language.d.ts` contains commented-out languages instead of using a formal deprecation or feature-flag system.
- **Single Source**: `Source` is currently hardcoded to `'BOJ'`, limiting multi-platform extensibility despite the factory pattern.
- **Manual Sync**: `Message.ts` manually re-exports and maps types from `../constants/messageTypes.ts`, creating a maintenance burden.
