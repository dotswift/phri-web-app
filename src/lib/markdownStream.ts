/**
 * Trims incomplete markdown syntax from the trailing edge of streaming text
 * so that ReactMarkdown doesn't render raw syntax characters mid-stream.
 *
 * Only applied while streaming — once the response is complete, the full
 * markdown is passed through untouched.
 */
export function trimIncompleteMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Incomplete code fence — odd number of ``` means one is unclosed.
  //    Strip the unclosed fence and everything after it.
  const fenceMatches = result.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    const lastFence = result.lastIndexOf("```");
    result = result.slice(0, lastFence);
  }

  // 2. Incomplete heading — trailing line that is just `# ` through `###### `
  //    with no content after the space (or no space yet).
  result = result.replace(/\n#{1,6}\s*$/, "");

  // 3. Incomplete table — ends with a header row + separator but no body row.
  //    Detect trailing `| --- | --- |` (separator line) with nothing after it.
  result = result.replace(
    /\n\|[^\n]+\|\s*\n\|[\s:|-]+\|\s*$/,
    ""
  );

  // Also strip a trailing separator line that has no header above it visible
  // (edge case: header row just arrived, separator row partially typed).
  result = result.replace(/\n\|[\s:|-]+\|\s*$/, "");

  // 4. Incomplete link/image — trailing `[text` or `[text](url` without closing `)`.
  //    Only strip if there's no complete `[...](...) ` after the last `[`.
  result = result.replace(/!?\[[^\]]*$/, "");
  result = result.replace(/!?\[[^\]]*\]\([^)]*$/, "");

  // 5. Unclosed bold/strong (`**`) — trailing `**text` without closing `**`.
  //    We count `**` occurrences; if odd, strip from the last opening `**`.
  const strongMatches = result.match(/\*\*/g);
  if (strongMatches && strongMatches.length % 2 !== 0) {
    const lastStrong = result.lastIndexOf("**");
    result = result.slice(0, lastStrong);
  }

  // 6. Unclosed italic (`*`) — after handling `**`, count remaining lone `*`.
  //    Replace `**` temporarily to count single `*` only.
  const withoutStrong = result.replace(/\*\*/g, "");
  const italicMatches = withoutStrong.match(/\*/g);
  if (italicMatches && italicMatches.length % 2 !== 0) {
    const lastItalic = result.lastIndexOf("*");
    result = result.slice(0, lastItalic);
  }

  return result;
}
