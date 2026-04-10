import { Fragment, type ReactNode } from "react";

const URL_PATTERN =
  /\b(?:https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|net|org)\b(?:\/[^\s]*)?)/gi;

const TRAILING_PUNCTUATION = new Set([".", ",", "!", "?", ";", ":"]);
const TRAILING_BRACKETS: Record<string, string> = {
  ")": "(",
  "]": "[",
  "}": "{",
};

function trimTrailingUrlCharacters(rawMatch: string) {
  let url = rawMatch;
  let trailing = "";

  while (url.length > 0) {
    const lastChar = url[url.length - 1];

    if (TRAILING_PUNCTUATION.has(lastChar)) {
      trailing = lastChar + trailing;
      url = url.slice(0, -1);
      continue;
    }

    const opener = TRAILING_BRACKETS[lastChar];
    if (!opener) break;

    const openCount = [...url].filter((char) => char === opener).length;
    const closeCount = [...url].filter((char) => char === lastChar).length;
    if (closeCount > openCount) {
      trailing = lastChar + trailing;
      url = url.slice(0, -1);
      continue;
    }

    break;
  }

  return { url, trailing };
}

function toHref(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function renderLinkifiedText(
  text: string,
  linkClassName = "underline underline-offset-2 break-all",
) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const fullMatch = match[0];
    const index = match.index ?? 0;
    const textStart = index;

    if (lastIndex < index) {
      nodes.push(text.slice(lastIndex, index));
    }

    const { url, trailing } = trimTrailingUrlCharacters(fullMatch);

    if (url) {
      nodes.push(
        <a
          key={`${textStart}-${url}`}
          href={toHref(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          onClick={(event) => event.stopPropagation()}
        >
          {url}
        </a>,
      );
    }

    if (trailing) {
      nodes.push(trailing);
    }

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>);
}
