// JFBench measures Japanese instruction following with one, two, four and eight constraints.
// The repository README publishes pass rates and an average for reasoning and non-reasoning settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/pfnet-research/jfbench/main/README.md';

const board: Leaderboard = {
  benchmark: 'jfbench',
  url: 'https://github.com/pfnet-research/jfbench',
  feed,
  terms: 'The repository is licensed under MIT. https://github.com/pfnet-research/jfbench/blob/main/LICENSE',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const section of ['### Reasoning', '### Non-Reasoning']) {
      const start = text.indexOf(section);
      if (start < 0) throw new Error('JFBench section missing: ' + section);
      const lines = text.slice(start).split('\n');
      const tableStart = lines.findIndex(line => line.startsWith('| Model |'));
      if (tableStart < 0) throw new Error('JFBench results table missing: ' + section);
      for (const line of lines.slice(tableStart + 2)) {
        if (!line.startsWith('|')) break;
        const cells = line.split('|').map(cell => cell.trim());
        if (cells.length < 7) throw new Error('Invalid JFBench row');
        const values = cells.slice(2, 6).map(Number);
        const score = Number(cells[6]);
        if (!values.every(Number.isFinite) || !Number.isFinite(score)) throw new Error('Invalid JFBench score');
        rows.push({ model: cells[1], score, setting: section.slice(4).toLowerCase(), metrics: { constraints1: values[0], constraints2: values[1], constraints4: values[2], constraints8: values[3] } });
      }
    }
    if (rows.length < 2) throw new Error('JFBench has too few rows');
    return rows;
  },
};

export default board;
