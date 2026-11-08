// AndroidWorld (Google Research). The official leaderboard is a public Google Sheet, read through its CSV
// export (docs.google.com robots.txt allows /spreadsheet paths). A warning line comes first, then the header:
// Rank, Release Date (month), Result Source, Model Type ("Model" for one model call per step, "AI agent" for
// a multi-call scaffold), Open?, Model Size, Model, Screen Representation, Success Rate (pass@1), Number of
// trials, Success Rate (pass@k), Trajectory submissions and Note. Pass@1 is the score. For "AI agent" rows
// the Result Source names the scaffold and becomes the harness, and the Model column names the model inside
// it. Rows that list several models stay unmatched. The sheet says results are self-reported and not
// independently verified. The month becomes the row date (its last day). Human baselines are dropped, and plain "GPT-4o" rows remain unlisted because the sheet does not identify their snapshot. The pass@k column, when it
// names k ("pass@2 95.69, pass@3 97.41"), gives metrics passAt2, passAt3 and so on.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const SHEET = 'https://docs.google.com/spreadsheets/d/1cchzP9dlTZ3WXQTfYNhh3avxoLipqHN75v1Tb86uhHo';
const FEED = `${SHEET}/export?format=csv&gid=0`;

const board: Leaderboard = {
  benchmark: 'androidworld',
  url: `${SHEET}/edit?gid=0`,
  feed: FEED,
  terms: 'Public Google Sheet read through its CSV export; docs.google.com robots.txt allows /spreadsheet paths and the sheet states no terms.',
  aliases: {
    'GPT6 Astra': 'gpt-6-astra',
    'Gemini 2.5 Computer Use': 'gemini-2-5-computer-use',
  },
  async fetch() {
    const csv = await fetchText(FEED);
    const start = csv.indexOf('Rank,Release Date');
    if (start < 0) throw new Error('header row not found');
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(csv.slice(start))) {
      const get = (re: RegExp) => Object.entries(r).find(([k]) => re.test(k.replace(/\s+/g, ' ')))?.[1]?.trim() ?? '';
      let model = get(/^Model$/);
      const type = get(/^Model Type$/);
      const score = Number(get(/^Success Rate \(pass@1\)$/));
      if (!model || !type || !get(/^Success Rate \(pass@1\)$/) || !Number.isFinite(score) || /^human$/i.test(model)) continue;
      if (/^gpt[- ]?4(?:o|[- ]turbo)?$/i.test(model)) model += ' (snapshot unspecified)';
      const month = get(/^Release Date$/).match(/^(\d{1,2})\/(\d{4})$/);
      const date = month ? new Date(Date.UTC(Number(month[2]), Number(month[1]), 0)).toISOString().slice(0, 10) : undefined;
      // "pass@2 95.69, pass@3 97.41" in the pass@k column: metrics passAt2, passAt3
      const passAt = Object.fromEntries([...get(/^Success Rate \(pass@k\)$/).matchAll(/pass@(\d+)\s+([\d.]+)/g)].map((m) => [`passAt${m[1]}`, Number(m[2])]));
      const metrics = Object.keys(passAt).length ? passAt : undefined;
      rows.push({ model, score, harness: type === 'AI agent' ? get(/^Result Source$/) || undefined : undefined, date, metrics });
    }
    if (!rows.length) throw new Error('no rows in the AndroidWorld sheet');
    return rows;
  },
};
export default board;
