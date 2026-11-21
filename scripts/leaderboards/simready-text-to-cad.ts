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
  verified: 'Marked official in the SimReady validation report.',
  parts: { explicit: { name: 'Explicit', group: 'Prompt phrasing' }, engineer: { name: 'Engineer', group: 'Prompt phrasing' }, intent: { name: 'Intent', group: 'Prompt phrasing' } },
  stats: {
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    inputTokens: { name: 'Prompt tokens', unit: 'tokens' },
    outputTokens: { name: 'Completion tokens', unit: 'tokens' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(feed);
    const markdownRows = (header: string) => {
      const start = text.indexOf(header);
      if (start < 0) return new Map<string, string[]>();
      const rows = new Map<string, string[]>();
      for (const line of text.slice(start + header.length).split('\n').slice(2)) {
        if (!line.startsWith('|')) break;
        const cells = line.split('|').map((v) => v.trim()).filter(Boolean);
        if (cells.length) rows.set(cells[0], cells);
      }
      return rows;
    };
    const setup = markdownRows('| model | id | base URL | k | temp | prompt sha256 | checker | official | started | incomplete prompts |');
    const headline = markdownRows('| model | pass@1 | 95% CI | pass@k | 95% CI | concepts | prompts |');
    const cost = markdownRows('| model | calls | prompt tokens | completion tokens | median latency (s) | excluded (infra/checker) |');
    const section = text.slice(text.indexOf('| model | pass@1 |'));
    const lines = section.split('\n').slice(2);
    const rows: LeaderboardRow[] = [];
    for (const line of lines) {
      const cells = line.split('|').map((v) => v.trim()).filter(Boolean);
      if (cells.length < 7 || !/^gpt-|^gemini-/i.test(cells[0])) break;
      const pass1 = Number(cells[1].replace('%', ''));
      const passK = Number(cells[3].replace('%', ''));
      if (!Number.isFinite(pass1) || !Number.isFinite(passK)) throw new Error('Invalid SimReady row');
      const interval = headline.get(cells[0])?.[2].match(/\[([\d.]+)%,\s*([\d.]+)%\]/);
      const setupRow = setup.get(cells[0]);
      const costRow = cost.get(cells[0]);
      const metrics: Record<string, number> = { passAt5: passK };
      if (costRow) {
        const latency = Number(costRow[4]);
        const inputTokens = Number(costRow[2].replace(/,/g, ''));
        const outputTokens = Number(costRow[3].replace(/,/g, ''));
        if (Number.isFinite(latency)) metrics.latency = latency;
        if (Number.isFinite(inputTokens)) metrics.inputTokens = inputTokens;
        if (Number.isFinite(outputTokens)) metrics.outputTokens = outputTokens;
      }
      rows.push({ model: cells[0], score: pass1,
        ...(interval ? { low: Number(interval[1]), high: Number(interval[2]) } : {}),
        ...(setupRow?.[7] === 'True' ? { verified: true } : {}), metrics });
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
