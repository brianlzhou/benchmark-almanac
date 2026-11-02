// Spider 1.0. yale-lily.github.io/spider is a static page with two leaderboards. The first, "Execution with
// Values", ranks systems by execution accuracy on the hidden test set, the number labs cite ("Spider Test
// execution accuracy"), so it is the score here; the second (exact set match without values) is not read.
// Each entry is a text-to-SQL system, often a prompting or decoding method on a base model ("DAIL-SQL + GPT-4
// + Self-Consistency", "T5-3B+PICARD"). The model is the part of the name that is a base model, and the
// whole system name is the harness; systems on base models outside the registry (BERT, ELECTRA, GraPPa)
// do not resolve and drop out. Rows carry the board's submission date.
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
  feed: `${URL} (static HTML, Execution with Values table, Test)`,
  terms: 'Static page on GitHub Pages; robots.txt allows it and the Spider data is CC BY-SA 4.0.',
  aliases: {
    // OpenAI's chat model as of the June 2023 C3 entry
    ChatGPT: 'gpt-3-5-turbo-mar-2023',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(URL))[0];
    if (!t || t[0]?.map((c) => c.text).join('|') !== 'Rank|Model|Test') throw new Error('Execution with Values table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const system = text(r[1]?.html.split(/<p class="institution"/)[0] ?? '');
      const parts = system
        .replace(/\(DB content used\)/gi, '')
        .split(/\s*\+\s*|\s+with\s+/i)
        .map((p) => p.trim());
      const base = parts.find((p) => BASE.test(p));
      const score = num(r[2]?.text);
      if (!base || score === undefined) continue;
      rows.push({ model: base, score, harness: system.replace(/\s*\(DB content used\)/i, ''), date: isoDate(r[0]?.text ?? '') });
    }
    return rows;
  },
};
export default board;
