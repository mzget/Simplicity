/**
 * Splits a free-text hashtag input into normalized `#tag` tokens.
 * Whitespace-separated, empty tokens dropped, missing `#` prefix added.
 */
export const parseHashtags = (input: string): string[] =>
  input
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== '#')
    .map((t) => (t.startsWith('#') ? t : `#${t}`));

