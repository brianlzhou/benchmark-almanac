// Small readers for leaderboards that ship their data as static HTML tables, inline script arrays or
// Next.js page payloads. Only for pages that are server-rendered or static and whose terms allow reading.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#x27': "'" };

/** Visible text of an HTML fragment: tags dropped, common entities decoded, spaces collapsed. */
export function text(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (ENTITIES[e.toLowerCase()]) return ENTITIES[e.toLowerCase()];
      if (/^#x/i.test(e)) return String.fromCodePoint(parseInt(e.slice(2), 16));
      if (/^#\d/.test(e)) return String.fromCodePoint(Number(e.slice(1)));
      return m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Cell {
  html: string;
  text: string;
  /** Attributes of the cell's own tag, for example data-sort. */
  attrs: Record<string, string>;
}

/** Every <table> in the page, as rows of cells (header and body rows alike). */
export function tables(html: string): Cell[][][] {
  return [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((t) =>
    [...t[0].matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi)].map((tr) =>
      [...tr[2].matchAll(/<t([hd])\b([^>]*)>([\s\S]*?)<\/t\1>/gi)].map((c) => ({
        html: c[3],
        text: text(c[3]),
        attrs: Object.fromEntries([...c[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
      })),
    ),
  );
}

/** A number in a cell such as "67.85%", "**0.602**" or "$8.91"; undefined for "-", "N/A" or "TBA". */
export function num(s: string | undefined): number | undefined {
  const m = s?.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

/** The text pushed into a Next.js app-router page through self.__next_f, joined in order. */
export function nextFlight(html: string): string {
  return [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)].map((m) => JSON.parse(`"${m[1]}"`) as string).join('');
}

/** The JSON array or object that starts at `from` in `s`, matched by brackets (strings respected). */
export function jsonAt<T>(s: string, from: number): T {
  const open = s[from];
  if (open !== '[' && open !== '{') throw new Error(`no JSON value at ${from}`);
  let depth = 0;
  let quoted = false;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '\\') i++;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) return JSON.parse(s.slice(from, i + 1)) as T;
    }
  }
  throw new Error('unterminated JSON value');
}

/** The JSON value that follows the first occurrence of `marker` (for example `"verifiedData":`). */
export function jsonAfter<T>(s: string, marker: string): T {
  const i = s.indexOf(marker);
  if (i < 0) throw new Error(`marker not found: ${marker}`);
  const start = s.slice(i + marker.length).search(/[[{]/);
  return jsonAt<T>(s, i + marker.length + start);
}

/**
 * A JavaScript array or object literal from a page script, read as data, never run: comments, trailing
 * commas and unquoted keys are normalized, then JSON.parse reads it. Single-quoted strings are not supported.
 */
export function jsLiteral<T>(s: string, from: number): T {
  let out = '';
  let depth = 0;
  let quoted = false;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      out += c;
      if (c === '\\') out += s[++i];
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '/' && s[i + 1] === '/') {
      while (i < s.length && s[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      const end = s.indexOf('*/', i + 2);
      if (end < 0) throw new Error('unterminated comment');
      i = end + 1;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    out += c;
    if (depth === 0) break;
  }
  const json = out.replace(/,(\s*[}\]])/g, '$1').replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
  return JSON.parse(json) as T;
}
