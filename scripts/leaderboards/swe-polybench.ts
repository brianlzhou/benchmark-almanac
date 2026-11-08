// SWE-PolyBench (Amazon). amazon-science.github.io/SWE-PolyBench is a static page with three leaderboard
// tabs, each a server-rendered table: "Full" (the 2,110-task benchmark this record describes), "PB500"
// (the stratified 500-task subset) and "Verified". Only Full belongs to this record.
// The score is its published Overall resolve rate; language results remain metrics. Entries name an agent and its
// model as "Agent (Model)" or "Agent + Model"; the model part is the model and the agent the harness, and
// entries without a model (Amazon Q Developer Agent, iSWE-Agent) do not resolve.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const PAGE = 'https://amazon-science.github.io/SWE-PolyBench/';
const TAB = 'leaderboard-Full';

const board: Leaderboard = {
  benchmark: 'swe-polybench',
  url: PAGE,
  feed: `${PAGE} (static HTML, Full table, Overall)`,
  terms: 'Static page on GitHub Pages; robots.txt allows it and the SWE-PolyBench repository is MIT-licensed.',
  aliases: {
    // the April 2025 paper runs: Claude 3.5 Sonnet (October 2024) and Claude 3.5 Haiku
    'Sonnet 3.5': 'claude-3-5-sonnet-october-2024',
    Haiku: 'claude-3-5-haiku',
    'Deepseek-R1-Distill Llama 70B': 'deepseek-r1-distill-llama-70b',
    'Llama3.3 70B': 'llama-3-3-70b',
    // mistral-large-latest pointed to Mistral Large 2.1 (24.11) in April 2025
    'Mistral-Large': 'mistral-large-2-nov-2024',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    for (const TAB of ['leaderboard-Full']) {
    const start = html.indexOf(`id="${TAB}"`);
    if (start < 0) throw new Error(`${TAB} tab not found`);
    const [t] = tables(html.slice(start));
    const header = t?.find((r) => r[0]?.text === 'Model');
    const iOverall = header?.findIndex((c) => c.text === 'Overall') ?? -1;
    if (!t || !header || iOverall < 0) throw new Error('unexpected SWE-PolyBench table');
    for (const r of t.slice(t.indexOf(header) + 1)) {
      const name = r[0]?.text.replace(/^[🥇🥈🥉]\s*/u, '').trim() ?? '';
      const score = num(r[iOverall]?.text);
      const date = r.find((c) => /^\d{4}-\d\d-\d\d$/.test(c.text))?.text;
      const paren = name.match(/^(.*?)\s*\(([^)]+)\)$/);
      const plus = name.match(/^(.*?)\s+\+\s+(.+)$/);
      const [harness, model] = paren && !/^v\d/.test(paren[2]) ? [paren[1], paren[2]] : plus ? [plus[1], plus[2]] : [undefined, name];
      if (score !== undefined) rows.push({ model, score, harness, date, setting: TAB.replace('leaderboard-',''), metrics: Object.fromEntries([2,3,4,5].flatMap(i=>{const v=num(r[i]?.text);return v===undefined?[]:[[header[i].text,v]];})) });
    }
    }
    return rows;
  },
};
export default board;
