// RULER (NVIDIA): accuracy across synthetic long-context tasks, in percent. The live README reports
// the published Avg. column as the headline. Context lengths and weighted averages are metrics.
// Linked model identifiers retain the exact configuration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
const FEED = 'https://raw.githubusercontent.com/NVIDIA/RULER/main/README.md';
const board: Leaderboard = {
  benchmark: 'ruler', url: 'https://github.com/NVIDIA/RULER', feed: FEED,
  terms: 'Public NVIDIA RULER repository results, subject to the repository license and GitHub terms.',
  async fetch() {
    const source = await fetchText(FEED);
    const section = source.slice(source.indexOf('|Models|'), source.indexOf('## ✅ Updates'));
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      if (!line.includes('](') || !line.includes('|')) continue;
      const cells = line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|');
      const link = cells[0].match(/https:\/\/huggingface.co\/[^/]+\/([^\s)]+)/)?.[1];
      const model = link ? decodeURIComponent(link) : (cells[0].match(/\[([^\]]+)\]/)?.[1] ?? text(cells[0])).replace(/[*`]/g, '');
      const keys = ['4K', '8K', '16K', '32K', '64K', '128K', 'Avg.', 'wAvg. (inc)', 'wAvg. (dec)'];
      const metrics: Record<string, number> = {};
      for (const [i, key] of keys.entries()) {
        const value = num(text(cells[i + 3] ?? ''));
        if (value !== undefined) metrics[key] = value;
      }
      const score = metrics['Avg.'];
      if (score !== undefined) rows.push({model, score, metrics});
    }
    if (!rows.length) throw new Error('No RULER accuracy rows');
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;
