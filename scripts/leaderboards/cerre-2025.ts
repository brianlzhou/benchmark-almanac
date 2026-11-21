// CERRE evaluates rhetorical analysis of Chinese essays. The organizers' CSV ranks teams by Combined Score across three tracks.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/cubenlp/CERRE-2025CCL/main/CERRE-2025CCL%20%E7%BB%BC%E5%90%88%E5%BE%97%E5%88%86%E6%8E%92%E5%90%8D%E6%A6%9C%E5%8D%95.csv";
const board: Leaderboard = {
  benchmark: "cerre-2025",
  url: "https://github.com/cubenlp/CERRE-2025CCL/blob/main/CERRE-2025CCL%20%E7%BB%BC%E5%90%88%E5%BE%97%E5%88%86%E6%8E%92%E5%90%8D%E6%A6%9C%E5%8D%95.csv",
  feed: FEED,
  terms: "The organizers restrict competition data to noncommercial use. They do not specify separate terms for the team scores. https://github.com/cubenlp/CERRE-2025CCL The raw file host has no robots.txt.",
  parts: {"form": "Form Conversion", "content": "Content Conversion", "component": "Component Conversion"},
  async fetch() {
    const text = await fetchText(FEED);
    const expected = ["Team", "Form Conversion", "Content Conversion", "Component Conversion", "Combined Score"];
    const records = parseCsv(text.replace(/^\uFEFF/, ''));
    const headers = Object.keys(records[0] ?? {});
    const rows = records.map(record => headers.map(h => record[h]));
    if (!expected.every(h => headers.includes(h)) || rows.length < 8) throw new Error('Missing leaderboard columns or rows');
    return rows.map(cells => {
      const cell = (name: string) => cells[headers.indexOf(name)]?.trim();
      const number = (name: string) => {
        const raw = cell(name)?.replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error('Invalid ' + name + ' for ' + cells[0]);
        return Number(raw);
      };
      const model = cell("Team");
      if (!model) throw new Error('Missing model name');
      return { model, score: number("Combined Score"), metrics: { "form": number("Form Conversion"), "content": number("Content Conversion"), "component": number("Component Conversion") }, submitter: model };
    });
  },
};
export default board;
