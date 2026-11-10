import { useState } from "react";
import "./FormattedResponse.css";

/**
 * Parses inline formatting:
 * - ***bold italic***
 * - **bold** or __bold__ (font-weight: 600)
 * - `inline code` (font-weight: 500)
 * - *italic* or _italic_
 * - ~~strikethrough~~
 * - [link](url)
 */
function parseInline(text) {
  if (!text) return "";

  const inlineRegex =
    /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `inline_${match.index}_${token.slice(0, 5)}`;

    if (token.startsWith("***") && token.endsWith("***") && token.length > 6) {
      parts.push(
        <strong key={key} className="markdown-highlight">
          <em className="markdown-italic">{token.slice(3, -3)}</em>
        </strong>
      );
    } else if (
      (token.startsWith("**") && token.endsWith("**") && token.length > 4) ||
      (token.startsWith("__") && token.endsWith("__") && token.length > 4)
    ) {
      parts.push(
        <strong key={key} className="markdown-highlight">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      parts.push(
        <code key={key} className="markdown-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*") && token.length > 2) ||
      (token.startsWith("_") && token.endsWith("_") && token.length > 2)
    ) {
      parts.push(
        <em key={key} className="markdown-italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("~~") && token.endsWith("~~") && token.length > 4) {
      parts.push(
        <del key={key} className="markdown-del">
          {token.slice(2, -2)}
        </del>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const splitIdx = token.indexOf("](");
      const linkText = token.slice(1, splitIdx);
      const linkUrl = token.slice(splitIdx + 2, -1);
      parts.push(
        <a
          key={key}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="markdown-link"
        >
          {linkText}
        </a>
      );
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Splits plain markdown text into structured blocks:
 * - headings (# through ######)
 * - unordered lists (- or * or +)
 * - ordered lists (1. , 2. )
 * - blockquotes (> quote)
 * - tables (| col1 | col2 |)
 * - horizontal rules (--- or ***)
 * - paragraphs
 */
function parseBlocks(rawText) {
  const lines = rawText.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headings: # through ######, stripping potential #* or ## ** wrappers
    const headingMatch = trimmed.match(/^(#{1,6})\s*\*?\s*(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      let title = headingMatch[2].trim();
      // Remove wrapping bold asterisks if present in heading: **Title**
      if (title.startsWith("**") && title.endsWith("**") && title.length > 4) {
        title = title.slice(2, -2).trim();
      }
      blocks.push({
        type: "heading",
        level,
        content: title,
      });
      i++;
      continue;
    }

    // Blockquote: lines starting with >
    if (/^>\s?(.*)$/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?(.*)$/.test(lines[i])) {
        const qMatch = lines[i].match(/^>\s?(.*)$/);
        quoteLines.push(qMatch[1]);
        i++;
      }
      blocks.push({
        type: "blockquote",
        content: quoteLines.join("\n"),
      });
      continue;
    }

    // Markdown Table: line with pipes and next line separator (|---|)
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && i + 1 < lines.length) {
      const nextTrimmed = lines[i + 1].trim();
      if (nextTrimmed.startsWith("|") && /^[|\s-:]+$/.test(nextTrimmed)) {
        const headerCells = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        i += 2;
        const rows = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          const rowCells = lines[i]
            .trim()
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());
          rows.push(rowCells);
          i++;
        }
        blocks.push({
          type: "table",
          headers: headerCells,
          rows,
        });
        continue;
      }
    }

    // Unordered List (- or * or +)
    const bulletMatch = line.match(/^([ \t]*)([-*+])\s+(.*)$/);
    if (bulletMatch) {
      const items = [];
      while (i < lines.length) {
        const currLine = lines[i];
        const currBulletMatch = currLine.match(/^([ \t]*)([-*+])\s+(.*)$/);
        if (currBulletMatch) {
          items.push({
            indent: currBulletMatch[1].length,
            text: currBulletMatch[3],
          });
          i++;
        } else if (
          currLine.trim() &&
          currLine.startsWith("  ") &&
          items.length > 0 &&
          !currLine.match(/^([ \t]*)(\d+)[.)]\s+/) &&
          !currLine.match(/^#{1,6}\s+/)
        ) {
          items[items.length - 1].text += " " + currLine.trim();
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: "unordered-list",
        items,
      });
      continue;
    }

    // Ordered List (1. , 2. )
    const orderedMatch = line.match(/^([ \t]*)(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      const items = [];
      while (i < lines.length) {
        const currLine = lines[i];
        const currOrderedMatch = currLine.match(/^([ \t]*)(\d+)[.)]\s+(.*)$/);
        if (currOrderedMatch) {
          items.push({
            num: currOrderedMatch[2],
            indent: currOrderedMatch[1].length,
            text: currOrderedMatch[3],
          });
          i++;
        } else if (
          currLine.trim() &&
          currLine.startsWith("  ") &&
          items.length > 0 &&
          !currLine.match(/^([ \t]*)[-*+]\s+/) &&
          !currLine.match(/^#{1,6}\s+/)
        ) {
          items[items.length - 1].text += " " + currLine.trim();
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: "ordered-list",
        items,
      });
      continue;
    }

    // Normal Paragraph
    const paraLines = [line];
    i++;
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      if (!nextTrimmed) break;
      if (
        nextTrimmed.match(/^#{1,6}\s+/) ||
        nextTrimmed.match(/^[-*+]\s+/) ||
        nextTrimmed.match(/^\d+[.)]\s+/) ||
        nextTrimmed.match(/^>\s?/) ||
        nextTrimmed.match(/^(?:---|\*\*\*|___)\s*$/) ||
        (nextTrimmed.startsWith("|") && nextTrimmed.endsWith("|"))
      ) {
        break;
      }
      paraLines.push(nextLine);
      i++;
    }

    blocks.push({
      type: "paragraph",
      lines: paraLines,
    });
  }

  return blocks;
}

/**
 * Extracts fenced code blocks (```lang ... ```) safely across line breaks (CRLF or LF)
 */
function extractCodeBlocks(content) {
  if (!content) return [];
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = [];
  const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)[^\n]*\n([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: normalized.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: "code",
      language: (match[1] || "code").trim(),
      value: match[2].replace(/\n$/, ""),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < normalized.length) {
    parts.push({
      type: "text",
      value: normalized.slice(lastIndex),
    });
  }

  return parts;
}

/**
 * FormattedResponse Component
 * Renders organized AI responses with bold headings, normal paragraphs,
 * font-weight 600 highlights, clean neutral text color, and code blocks with copy.
 */
export const FormattedResponse = ({
  content,
  messageId,
  isSpeaking,
  onToggleSpeech,
}) => {
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleCopyFull = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  if (!content) return null;

  const parts = extractCodeBlocks(content);

  return (
    <div className="formatted-response">
      {parts.map((part, index) => {
        if (part.type === "code") {
          return (
            <CodeBlock
              key={`code_${index}`}
              language={part.language}
              code={part.value}
            />
          );
        }
        return <TextSection key={`text_${index}`} text={part.value} />;
      })}

      <div className="response-actions">
        {onToggleSpeech && (
          <button
            className={`speech-response-btn ${isSpeaking ? "speaking" : ""}`}
            onClick={() => onToggleSpeech(messageId, content)}
            title={isSpeaking ? "Stop speaking" : "Listen to response"}
            type="button"
          >
            {isSpeaking ? (
              <>
                <span className="equalizer-bars">
                  <span className="bar bar1"></span>
                  <span className="bar bar2"></span>
                  <span className="bar bar3"></span>
                </span>
                <span>Stop</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>Listen</span>
              </>
            )}
          </button>
        )}

        <button
          className="copy-response-btn"
          onClick={handleCopyFull}
          title="Copy full response"
          type="button"
        >
          {copiedResponse ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * CodeBlock Component
 * Clean dark container, language badge, copy code button with SVG feedback
 */
const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = language ? language.toUpperCase() : "CODE";

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-language">{displayLang}</span>
        <button
          className="code-copy-btn"
          onClick={handleCopy}
          type="button"
          title={copied ? "Copied to clipboard" : "Copy code"}
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * TextSection Component
 * Renders structured markdown blocks cleanly: bold headings, normal paragraphs,
 * lists, blockquotes, tables, and horizontal rules.
 */
const TextSection = ({ text }) => {
  const blocks = parseBlocks(text);

  return (
    <div className="text-section">
      {blocks.map((block, bIdx) => {
        if (block.type === "heading") {
          const Tag =
            block.level === 1
              ? "h2"
              : block.level === 2
              ? "h3"
              : block.level === 3
              ? "h4"
              : "h5";
          const headingClass =
            block.level === 1
              ? "markdown-h1"
              : block.level === 2
              ? "markdown-h2"
              : block.level === 3
              ? "markdown-h3"
              : "markdown-h4";

          return (
            <Tag key={`head_${bIdx}`} className={headingClass}>
              {parseInline(block.content)}
            </Tag>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`ul_${bIdx}`} className="markdown-list">
              {block.items.map((item, lIdx) => (
                <li key={`uli_${lIdx}`}>{parseInline(item.text)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={`ol_${bIdx}`} className="markdown-list-ordered">
              {block.items.map((item, lIdx) => (
                <li key={`oli_${lIdx}`}>{parseInline(item.text)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote key={`quote_${bIdx}`} className="markdown-blockquote">
              {parseInline(block.content)}
            </blockquote>
          );
        }

        if (block.type === "table") {
          return (
            <div key={`table_${bIdx}`} className="markdown-table-wrapper">
              <table className="markdown-table">
                <thead>
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th key={`th_${hIdx}`}>{parseInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={`tr_${rIdx}`}>
                      {row.map((cell, cIdx) => (
                        <td key={`td_${cIdx}`}>{parseInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "hr") {
          return <hr key={`hr_${bIdx}`} className="markdown-hr" />;
        }

        // Paragraph
        return (
          <p key={`p_${bIdx}`} className="markdown-paragraph">
            {block.lines.map((line, lIdx) => (
              <span key={`pline_${lIdx}`}>
                {parseInline(line)}
                {lIdx < block.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedResponse;
