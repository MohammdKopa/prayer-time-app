import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// This route renders docs/privacy-policy.md at build time — the markdown is
// the single source of truth (see docs/privacy-policy.md itself, and
// docs/play-listing.md which links here as the Play Store privacy policy
// URL). Never hand-copy the policy text into this file; edit the markdown
// instead and rebuild.

export const metadata: Metadata = {
  title: "سياسة الخصوصية — مواقيت الصلاة",
  description:
    "سياسة الخصوصية لتطبيق مواقيت الصلاة، بأربع لغات: العربية، الألمانية، التركية، الإنجليزية. لا يجمع التطبيق أي بيانات.",
};

type LangCode = "ar" | "de" | "tr" | "en";

// The markdown's own top-level ("# ...") heading text used to delimit each
// language's section — see the "# العربية" / "# Deutsch" / "# Türkçe" /
// "# English" headings in docs/privacy-policy.md.
const LANGUAGES: Array<{
  code: LangCode;
  heading: string;
  label: string;
  dir: "rtl" | "ltr";
}> = [
  { code: "ar", heading: "العربية", label: "العربية", dir: "rtl" },
  { code: "de", heading: "Deutsch", label: "Deutsch", dir: "ltr" },
  { code: "tr", heading: "Türkçe", label: "Türkçe", dir: "ltr" },
  { code: "en", heading: "English", label: "English", dir: "ltr" },
];

// ─── Markdown loading ────────────────────────────────────────────────

function readPrivacyMarkdown(): string {
  const filePath = path.join(process.cwd(), "docs", "privacy-policy.md");
  return fs.readFileSync(filePath, "utf-8");
}

// Splits the document into one raw markdown string per top-level ("# ")
// language heading, stopping each section at the internal
// "## Consistency checklist" appendix (not meant for the public page) or at
// the next top-level heading. Trailing "---" separator lines are dropped.
function splitLanguageSections(raw: string): Record<LangCode, string> {
  const wanted = new Map(LANGUAGES.map((l) => [l.heading, l.code]));
  const lines = raw.split("\n");
  const buffers: Partial<Record<LangCode, string[]>> = {};
  let current: LangCode | null = null;

  for (const line of lines) {
    const h1 = /^# (.+)$/.exec(line.trim());
    if (h1) {
      const code = wanted.get(h1[1].trim());
      current = code ?? null;
      if (current && !buffers[current]) buffers[current] = [];
      continue;
    }
    if (line.trim() === "## Consistency checklist") {
      current = null;
      continue;
    }
    if (current) buffers[current]!.push(line);
  }

  const sections = {} as Record<LangCode, string>;
  for (const { code } of LANGUAGES) {
    const bufLines = buffers[code] ?? [];
    while (bufLines.length && bufLines[bufLines.length - 1].trim() === "---") {
      bufLines.pop();
    }
    sections[code] = bufLines.join("\n").trim();
  }
  return sections;
}

// ─── Tiny markdown → React converter (headings, paragraphs, lists, links) ──

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] };

function parseBlocks(content: string): Block[] {
  const rawBlocks = content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return rawBlocks.map((block): Block => {
    if (block.startsWith("### ")) {
      return { type: "h3", text: block.slice(4).trim() };
    }
    if (block.startsWith("## ")) {
      return { type: "h2", text: block.slice(3).trim() };
    }
    const blockLines = block.split("\n").map((l) => l.trim());
    if (blockLines.every((l) => l.startsWith("- "))) {
      return { type: "ul", items: blockLines.map((l) => l.slice(2).trim()) };
    }
    return { type: "p", lines: blockLines };
  });
}

// Inline formatting: **bold**, [text](url) links, bare https:// URLs, and
// bare emails — the only inline markup used in docs/privacy-policy.md.
const INLINE_RE =
  /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')]+)|([\w.+-]+@[\w-]+\.[\w.-]+)/g;

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, bold, linkText, linkHref, bareUrl, bareEmail] = match;
    const key = `${keyPrefix}-${i++}`;
    if (bold !== undefined) {
      nodes.push(<strong key={key}>{bold}</strong>);
    } else if (linkText !== undefined && linkHref !== undefined) {
      nodes.push(
        <a
          key={key}
          href={linkHref}
          className="text-gold-soft underline underline-offset-2 hover:text-gold"
        >
          {linkText}
        </a>,
      );
    } else if (bareUrl !== undefined) {
      nodes.push(
        <a
          key={key}
          href={bareUrl}
          className="text-gold-soft underline underline-offset-2 hover:text-gold"
        >
          {bareUrl}
        </a>,
      );
    } else if (bareEmail !== undefined) {
      nodes.push(
        <a
          key={key}
          href={`mailto:${bareEmail}`}
          className="text-gold-soft underline underline-offset-2 hover:text-gold"
        >
          {bareEmail}
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function renderBlocks(blocks: Block[], keyPrefix: string): ReactNode {
  return blocks.map((block, idx) => {
    const key = `${keyPrefix}-b${idx}`;
    if (block.type === "h2") {
      return (
        <h2 key={key} className="mt-10 text-xl font-semibold text-gold-soft first:mt-0">
          {parseInline(block.text, key)}
        </h2>
      );
    }
    if (block.type === "h3") {
      return (
        <h3 key={key} className="mt-7 text-base font-semibold text-bone">
          {parseInline(block.text, key)}
        </h3>
      );
    }
    if (block.type === "ul") {
      return (
        <ul key={key} className="mt-3 list-disc space-y-2 ps-5 text-bone-dim">
          {block.items.map((item, itemIdx) => (
            <li key={`${key}-${itemIdx}`}>{parseInline(item, `${key}-${itemIdx}`)}</li>
          ))}
        </ul>
      );
    }
    // paragraph — join multi-line blocks (e.g. postal address) with <br/>
    return (
      <p key={key} className="mt-3 leading-relaxed text-bone-dim">
        {block.lines.map((line, lineIdx) => (
          <span key={`${key}-l${lineIdx}`}>
            {lineIdx > 0 && <br />}
            {parseInline(line, `${key}-l${lineIdx}`)}
          </span>
        ))}
      </p>
    );
  });
}

// ─── Page ────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  const raw = readPrivacyMarkdown();
  const sections = splitLanguageSections(raw);

  return (
    <main className="min-h-full px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-2xl font-bold text-gold" dir="ltr">
          Privacy Policy / سياسة الخصوصية
        </h1>

        <nav
          aria-label="Language"
          className="mt-6 flex flex-wrap justify-center gap-2 text-sm"
          dir="ltr"
        >
          {LANGUAGES.map((lang) => (
            <a
              key={lang.code}
              href={`#${lang.code}`}
              className="glass glass-interactive rounded-full px-4 py-1.5 text-bone-dim hover:text-gold-soft"
            >
              {lang.label}
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-12">
          {LANGUAGES.map((lang) => (
            <section
              key={lang.code}
              id={lang.code}
              lang={lang.code}
              dir={lang.dir}
              className={`glass rounded-2xl p-5 sm:p-8 ${lang.code === "ar" ? "ar" : ""}`}
            >
              {renderBlocks(parseBlocks(sections[lang.code]), lang.code)}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
