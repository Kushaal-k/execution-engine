# 010 - User Presence and Remote Cursors

## Problem

While CRDTs handle text synchronization seamlessly, collaborators in a shared session cannot see who else is online, where remote users are typing, or what code ranges they have highlighted. Without visual awareness indicators, multi-user editing feels disconnected and leads to accidental overlap.

## Goal

Implement real-time user presence tracking, username identification, and render dynamic remote user cursors and text selection highlights inside Monaco Editor.

## Architecture & Implementation

Utilized Socket.IO presence events and Yjs Awareness state to broadcast client cursor positions and selection ranges.

### Presence Payload & Style Injection Flow

```
┌───────────────────────────┐
│ User Cursor Move Event    │
│  (Line: 12, Column: 5)    │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐     Broadcast     ┌───────────────────────────┐
│ Socket.IO Presence Event  │ ────────────────> │ Server Sync Manager       │
└───────────────────────────┘                   └─────────────┬─────────────┘
                                                              │ Broadcast state
                                                              ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│ Monaco Dynamic CSS Class  │ <──────────────── │ Remote Client Listener    │
│  .remote-cursor-{userId}  │  deltaDecorations │  Update Awareness Map     │
└───────────────────────────┘                   └───────────────────────────┘
```

### Data Payload Structure

```typescript
interface UserPresence {
  userId: string;
  user: {
    username: string;
    color: string;
  };
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
}
```

### Dynamic Monaco CSS Class Injection

To render remote cursors with user-specific colors dynamically, custom CSS rules are injected into the document head at runtime:

```typescript
function injectUserStyles(userId: string, color: string) {
  const styleId = `user-style-${userId}`;
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = `
      .remote-cursor-${userId} {
        border-left: 2px solid ${color} !important;
        position: absolute;
      }
      .remote-selection-${userId} {
        background-color: ${color}33 !important;
      }
    `;
    document.head.appendChild(styleTag);
  }
}
```

## Features & Improvements

- **Username Input Guard**: Require users to enter a non-empty username before joining collaborative rooms; Monaco Editor remains `readOnly` until a valid username is set.
- **Dynamic Selection Highlights**: Renders highlighted text blocks of remote users in real time using semi-transparent HSL colors (`${color}33`).
- **Clean Decoration Management**: Tracks Monaco decoration IDs per user (`editor.deltaDecorations(oldDecorations, newDecorations)`), replacing old decorations atomically to prevent ghost cursors.

## Lessons Learned

- Remote cursor position rendering requires continuous management of Monaco decoration arrays to avoid memory leaks and stale cursor markers when users disconnect.
- Dynamically injecting scoped CSS classes per user ID allows fully customizable cursor colors without hardcoding static theme styles.

## Next Steps

- Refactor monolithic Monaco editor code by extracting stateful hooks (`useRemotePresence`, `useYjsSync`).
- Add a connected users sidebar list displaying online participants, avatar badges, and cursor colors.
