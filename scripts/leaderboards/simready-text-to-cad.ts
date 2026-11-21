// SimReady Text-to-CAD measures whether models produce valid CAD solids from text prompts.
// The headline is pass@1 on the 111 in-vocabulary prompts, reported as a percentage.
// This importer reads the project's frozen validation report.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/Sumanthreddy-DE/simready';
const feed = 'https://raw.githubusercontent.com/Sumanthreddy-DE/simready/v0.5.1/docs/validation/bench_v1.md';
const board: Leaderboard = {
  benchmark: 'simready-text-to-cad', url, feed,
  terms: 'The SimReady repository publishes this validation report under its repository license. https://github.com/Sumanthreddy-DE/simready/blob/main/LICENSE',
  parts: { explicit: { name: 'Explicit', group: 'Prompt phrasing' }, engineer: { name: 'Engineer', group: 'Prompt phrasing' }, intent: { name: 'Intent', group: 'Prompt phrasing' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(feed);
    const section = text.slice(text.indexOf('| model | pass@1 |'));
    const lines = section.split('\n').slice(2);
    const rows: LeaderboardRow[] = [];
    for (const line of lines) {
      const cells = line.split('|').map((v) => v.trim()).filter(Boolean);
      if (cells.length < 7 || !/^gpt-|^gemini-/i.test(cells[0])) break;
      const pass1 = Number(cells[1].replace('%', ''));
      const passK = Number(cells[3].replace('%', ''));
      if (!Number.isFinite(pass1) || !Number.isFinite(passK)) throw new Error('Invalid SimReady row');
      rows.push({ model: cells[0], score: pass1, metrics: { passAt5: passK } });
    }
    const styleStart = text.indexOf('| model | explicit | engineer | intent |');
    if (styleStart >= 0) {
      for (const line of text.slice(styleStart).split('\n').slice(2)) {
        const cells = line.split('|').map((v) => v.trim()).filter(Boolean);
        if (cells.length < 4 || !/^gpt-|^gemini-/i.test(cells[0])) break;
        const row = rows.find((candidate) => candidate.model === cells[0]);
        if (row) row.metrics = { ...(row.metrics ?? {}), explicit: Number(cells[1]), engineer: Number(cells[2]), intent: Number(cells[3]) };
      }
    }
    if (rows.length < 2) throw new Error('SimReady rows missing');
    return rows;
  },
};
export default board;
