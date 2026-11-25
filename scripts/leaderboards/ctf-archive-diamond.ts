// CTF-Archive Diamond is a 285-challenge cybersecurity benchmark from CAISI's pwn.college selection.
// The headline score is the percentage of challenges completed by an Inspect ReAct agent.
// This importer reads the public Village LLM Atlas leaderboard table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
const PAGE = 'https://atlas.village.dev/benchmarks/ctf-archive-diamond';
const num = (s: string) => Number(s.replace(/[^\d.]/g, ''));
const board: Leaderboard = {
  benchmark: 'ctf-archive-diamond', url: PAGE, feed: `${PAGE} (the published leaderboard table)`,
  terms: 'Village LLM Atlas publishes this table under CC BY-SA 4.0 and links each result source. Results are credited to Village.',
  async fetch() {
    const ts = tables(await fetchText(PAGE));
    const t = ts.find((x) => x[0]?.map((c) => c.text).join('|') === '#|Model|Setting|Score|Source');
    if (!t) throw new Error('CTF-Archive Diamond: leaderboard table missing');
    const rows: LeaderboardRow[] = t.slice(1).map((r) => {
      const href = r[4]?.html.match(/href="(https?:\/\/[^"]+)"/)?.[1];
      const date = r[4]?.text.match(/\b(20\d\d-\d\d-\d\d)\b/)?.[1];
      return {
        model: r[1].text.trim(),
        setting: r[2].text.replace(/\s*·\s*CAISI.*$/, '').trim(),
        score: num(r[3].text),
        harness: 'CAISI Inspect ReAct agent',
        date,
        link: href,
      };
    }).filter((r) => r.model && Number.isFinite(r.score));
    if (rows.length < 6) throw new Error(`CTF-Archive Diamond: ${rows.length} rows, expected 6`);
    return rows;
  },
};
export default board;
