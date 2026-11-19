/** Chat size limits shared by the chat box (browser) and the chat server check. */

/** Largest chat request we accept (bytes); a long conversation is well under this. */
export const MAX_BODY_BYTES = 256 * 1024;
/** Longest single text part (characters) — stops pasted walls of text running up AI cost. */
export const MAX_TEXT_CHARS = 4000;
