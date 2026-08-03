import * as monaco from "monaco-editor";
import type { PresenceUpdate } from "../../../server/src/types/types";

function injectUserStyles(userId: string, color: string) {
  const styleId = `remote-user-style-${userId}`;
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    .remote-cursor-${userId} {
      border-left: 2px solid ${color} !important;
      margin-left: -1px;
      position: relative;
      z-index: 10;
    }
    .remote-selection-${userId} {
      background-color: ${color}55 !important; /* 33% opacity for vibrant color on vs-dark */
    }
  `;
}

export function removeUserStyles(userId: string) {
  const styleEl = document.getElementById(`remote-user-style-${userId}`);
  if (styleEl) {
    styleEl.remove();
  }
}

export function createRemoteDecoration(
    update: PresenceUpdate
): monaco.editor.IModelDeltaDecoration[] {
    const { cursor, selection } = update.presence;
    const { username, color } = update.user;
    const { userId } = update;

    if(!cursor) return;

    injectUserStyles(userId, color);

    const decorations: monaco.editor.IModelDeltaDecoration[] = [
        {
            range: new monaco.Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column + 1
            ),
            options: {
                beforeContentClassName: `remote-cursor-${userId}`,
                hoverMessage: { value: username }
            }
        }
    ];

    const hasSelection = selection && !(
        selection.startLineNumber === selection.endLineNumber &&
        selection.startColumn === selection.endColumn
    );

    if(hasSelection && selection) {
        decorations.push({
            range: new monaco.Range(
                selection.startLineNumber,
                selection.startColumn,
                selection.endLineNumber,
                selection.endColumn
            ),
            options: {
                className: `remote-selection-${userId}`,
                hoverMessage: { value: username }
            }
        })
    }

    return decorations;
}