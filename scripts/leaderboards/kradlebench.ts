// KradleBench: models play live multi-agent Minecraft games through one shared harness, reading the world as JSON
// and acting by writing code. The overall score (0 to 100) weights five dimensions: collaboration, economy and
// conflict at 30% each, logic and creativity at 5% each. The importer reads the table on the models page, which also
// gives cost per run, latency and the number of runs. The skilled human row is left out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const URL = 'https://www.kradle.ai/bench/models';
const HEADER = 'Model|Overall|Collaboration|Economy|Conflict|Logic|Creativity|Cost / run|Latency|Runs';
const num = (s: string) => {
  const v = Number(s.replace(/[$,s\s]/g, ''));
  if (!Number.isFinite(v)) throw new Error(`Unexpected KradleBench number: ${s}`);
  return v;
};

const board: Leaderboard = {
  benchmark: 'kradlebench',
  url: URL,
  feed: URL,
  aliases: { 'Nvidia Nemotron 3.5 Super VL': 'nemotron-3-5-super-vl' },
  terms: 'Kradle’s robots.txt allows all paths. https://www.kradle.ai/robots.txt The scores are credited to Kradle.',
  parts: {
    collaboration: 'Collaboration',
    economy: 'Economy',
    conflict: 'Conflict',
    logic: 'Logic',
    creativity: 'Creativity',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(URL)).find((t) => t[0]?.map((c) => c.text).join('|') === HEADER);
    if (!t) throw new Error('KradleBench models table missing or its columns changed');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const c = r.map((x) => x.text.trim());
      if (/^Skilled Human/i.test(c[0])) continue;
      // the maker comes first, which doubles a word when the model carries the maker's name (Grok Grok 4.7)
      const model = c[0].replace(/\s*#\s*\d+.*$/, '').trim().replace(/^(\S+)\s+(?=\1\b)/i, '');
      rows.push({
        model,
        score: num(c[1]),
        ...(c[7].startsWith('$') ? { cost: num(c[7]) } : {}),
        trials: num(c[9]),
        metrics: {
          collaboration: num(c[2]), economy: num(c[3]), conflict: num(c[4]), logic: num(c[5]), creativity: num(c[6]),
          ...(c[8].endsWith('s') ? { latency: num(c[8]) } : {}),
        },
      });
    }
    if (rows.length < 20) throw new Error(`Expected about 26 models, read ${rows.length}`);
    return rows;
  },
};
export default board;
