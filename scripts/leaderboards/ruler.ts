// RULER (NVIDIA): accuracy across synthetic long-context tasks, in percent. The live README reports
// the published Avg. column as the headline. Context lengths and weighted averages are metrics.
// Read the linked model, its published size, and claimed and effective lengths. Keep inequalities as bounds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
const FEED = 'https://raw.githubusercontent.com/NVIDIA/RULER/main/README.md';
const board: Leaderboard = {
  benchmark: 'ruler', measures: { '128K': '128k' }, parts: {
  '4K': { name: '4K', group: 'Length' },
  '8K': { name: '8K', group: 'Length' },
  '16K': { name: '16K', group: 'Length' },
  '32K': { name: '32K', group: 'Length' },
  '64K': { name: '64K', group: 'Length' },
  '128K': { name: '128K', group: 'Length' },
}, url: 'https://github.com/NVIDIA/RULER', feed: FEED,
  terms: 'Public NVIDIA RULER repository results, subject to the repository license and GitHub terms.',
  stats: {
    'Avg.': { name: 'Average accuracy', unit: '%', better: 'higher' },
    'wAvg. (inc)': { name: 'Weighted average accuracy increasing', unit: '%', better: 'higher' },
    'wAvg. (dec)': { name: 'Weighted average accuracy decreasing', unit: '%', better: 'higher' },
    claimedLengthK: { name: 'Claimed context length', unit: 'thousands' },
    effectiveLengthK: { name: 'Effective context length', unit: 'thousands', better: 'higher' },
    effectiveLengthAboveK: { name: 'Effective context length lower bound', unit: 'thousands', better: 'higher', note: 'Published as a greater-than threshold in thousands of tokens.' },
    effectiveLengthBelowK: { name: 'Effective context length upper bound', unit: 'thousands', better: 'higher', note: 'Published as a less-than threshold in thousands of tokens.' },
    activeParams: { name: 'Active parameters', unit: 'billions' },
  },
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
      for (const [column, key] of [[1, 'claimedLength'], [2, 'effectiveLength']] as const) {
        const length = cells[column]?.trim().match(/^([<>]?)(\d+(?:\.\d+)?)([KM])$/i);
        if (!length) continue;
        const bound = length[1] === '<' ? 'Below' : length[1] === '>' ? 'Above' : '';
        metrics[key + bound + 'K'] = Number(length[2]) * (length[3].toUpperCase() === 'M' ? 1024 : 1);
      }
      const size = cells[0].match(/\((?:(\d+(?:\.\d+)?)B\/)?(\d+(?:\.\d+)?)B\)\s*$/i);
      if (size?.[1]) metrics.activeParams = Number(size[1]);
      if (score !== undefined) rows.push({model, score, metrics, params: size ? Number(size[2]) : undefined});
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
