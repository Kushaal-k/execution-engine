import * as monaco from "monaco-editor";
import type { PresenceUpdate } from "../../../server/src/types/types";


export function createRemoteDecoration(
    update: PresenceUpdate
): monaco.editor.IModelDeltaDecoration[] {
    const { cursor, selection, username } = update.presence;

    if(!cursor) return;

    const decorations: monaco.editor.IModelDeltaDecoration[] = [
        {
            range: new monaco.Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column + 1
            ),
            options: {
                beforeContentClassName: "remote-cursor",
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
                className: "remote-selection",
                hoverMessage: { value: username }
            }
        })
    }

    return decorations;
}