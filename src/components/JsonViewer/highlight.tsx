import { Fragment, type ReactNode } from "react";

/**
 * Tiny, dependency-free JSON syntax highlighter. Tokenizes a pretty-printed
 * JSON string and wraps each token in a colored span. Good enough for API
 * responses without pulling in a full highlighting library.
 */
const TOKEN_RE =
  /("(\\.|[^"\\])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?|[{}[\],])/g;

export function highlightJson(json: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(json)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{json.slice(lastIndex, match.index)}</Fragment>,
      );
    }

    const text = match[0];
    let className = "text-foreground";

    if (/^"/.test(text)) {
      // String — distinguish object keys (trailing colon) from values.
      className = text.trimEnd().endsWith(":")
        ? "text-sky-600 dark:text-sky-400"
        : "text-emerald-600 dark:text-emerald-400";
    } else if (/^(true|false)$/.test(text)) {
      className = "text-amber-600 dark:text-amber-400";
    } else if (text === "null") {
      className = "text-rose-500 dark:text-rose-400";
    } else if (/^-?\d/.test(text)) {
      className = "text-violet-600 dark:text-violet-400";
    } else {
      className = "text-muted-foreground"; // punctuation
    }

    nodes.push(
      <span key={key++} className={className}>
        {text}
      </span>,
    );
    lastIndex = match.index + text.length;
  }

  if (lastIndex < json.length) {
    nodes.push(<Fragment key={key++}>{json.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}
