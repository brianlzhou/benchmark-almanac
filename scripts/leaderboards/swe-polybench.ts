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
  parts: {
    Java: { name: 'Java', group: 'Language' },
    Python: { name: 'Python', group: 'Language' },
    JavaScript: { name: 'JavaScript', group: 'Language' },
    TypeScript: { name: 'TypeScript', group: 'Language' },
  },
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
      if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const [i, cell] of header.entries()) {
        const column = cell.attrs['data-sort'] ?? '';
        const value = num(r[i]?.text);
        if (value === undefined || column === 'resolved') continue;
        if (column.startsWith('resolved_') && i >= 2 && i <= 5) metrics[cell.text] = value;
        else if (/^(resolved_|file_|node_)/.test(column)) {
          const key = column.replace(/_(.)/g, (_, c: string) => c.toUpperCase());
          metrics[key] = value;
          if (column.startsWith('resolved_')) {
            const name = column.slice(9).replaceAll('_', ' ').replace(/func\b/, 'function');
            board.parts![key] = {name, group: 'Patch complexity'};
          }
        }
      }
      const org = r[header.findIndex(c => c.text === 'Org')]?.html ?? '';
      const affiliations = [['/u/172139148?', 'Aider AI'], ['/u/166046056?', 'SWE-agent'],
        ['brand.illinois.edu/', 'University of Illinois'], ['Amazon_Web_Services_Logo', 'Amazon Web Services'], ['ibm-logo.png', 'IBM']];
      const agentOrg = affiliations.find(([image]) => org.includes(image))?.[1];
      const logs = r[header.findIndex(c => c.text === 'Logs')]?.html.match(/href="([^"]+)"/)?.[1];
      rows.push({model, score, harness, date, agentOrg, link: logs, setting: TAB.replace('leaderboard-',''), metrics});
    }
    }
    return rows;
  },
};
export default board;
