// Spider 1.0. yale-lily.github.io/spider is a static page with two leaderboards. The first, "Execution with
// Values", ranks systems by execution accuracy on the hidden test set, the number labs cite ("Spider Test
// execution accuracy"). Exact set match without values is a secondary metric on matching system rows.
// Each entry is a text-to-SQL system, often a prompting or decoding method on a base model ("DAIL-SQL + GPT-4
// + Self-Consistency", "T5-3B+PICARD"). The model is the part of the name that is a base model, and the
// whole system name is the harness; systems on base models outside the registry (BERT, ELECTRA, GraPPa)
// remain unlisted. Undated GPT/ChatGPT families are not assigned to a snapshot. Rows carry the board's submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num } from '../lib/html.ts';

const URL = 'https://yale-lily.github.io/spider';

// base models named in system names, in the board's spelling
const BASE = /^(GPT-4|ChatGPT|CodeX|T5-3B|T5-Base|T5-Large|GPT-3\.5-turbo|Llama[\w.-]*|CodeLlama[\w.-]*)$/i;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function isoDate(s: string): string | undefined {
  const m = s.match(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return undefined;
  const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  return mi < 0 ? undefined : `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

const board: Leaderboard = {
  benchmark: 'spider',
  url: URL,
  feed: `${URL} (static HTML, execution table, Test)`,
  terms: 'Static page on GitHub Pages; robots.txt allows it and the Spider data is CC BY-SA 4.0.',
  aliases: {},
  async fetch(): Promise<LeaderboardRow[]> {
    const all = tables(await fetchText(URL));
    const rows: LeaderboardRow[] = [];
    const exact = new Map((all[1] ?? []).slice(1).map(r => [
      text(r[1]?.html.split(/<p class="institution"/)[0] ?? '').replace(/\s*\(DB content used\)/i, ''),
      num(r[3]?.text),
    ]));
    for (let i = 0; i < 1; i++) {
      const t = all[i];
      const head = t?.[0]?.map(c => c.text) ?? [];
      if (head[0] !== 'Rank' || !head.includes('Model') || !head.includes('Test')) throw new Error('Spider score table missing');
      for (const r of t.slice(1)) {
        const system = text(r[1]?.html.split(/<p class="institution"/)[0] ?? '').replace(/\s*\(DB content used\)/i, '');
        const base = system.split(/\s*\+\s*|\s+with\s+/i).map(p => p.trim()).find(p => BASE.test(p));
        const score = num(r[head.indexOf('Test')]?.text);
        if (!system || score === undefined || /^human/i.test(system)) continue;
        const ambiguous = base && /^(GPT-4|ChatGPT|GPT-3\.5-turbo)$/i.test(base);
        const model = ambiguous ? `${base} (snapshot unspecified)` : base ?? system;
        const dev = num(r[head.indexOf('Dev')]?.text);
        rows.push({ model, score, harness: system, date: isoDate(r[0]?.text ?? ''),
          metrics: { ...(dev === undefined ? {} : { developmentExecution: dev }),
            ...(exact.get(system) === undefined ? {} : { exactMatch: exact.get(system)! }) } });
      }
    }
    return rows;
  },
};
export default board;
