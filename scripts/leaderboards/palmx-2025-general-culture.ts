// PalmX ranks team systems by accuracy on General Culture questions. Read the standings in the General Culture section of the results page.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://palmx.dlnlp.ai/leaderboard.html";
const board: Leaderboard = {
  benchmark: "palmx-2025-general-culture",
  url: "https://palmx.dlnlp.ai/leaderboard.html",
  feed: FEED,
  terms: "The General Culture table ranks 9 teams. The site states all rights reserved. https://palmx.dlnlp.ai/leaderboard.html The host has no published robots directives at /robots.txt.",
  async fetch() {
    const text = await fetchText(FEED);
    const expected = ["Rank", "Team", "Affiliation", "Accuracy", "Members"];
    const table = tables(text.split(/General Culture Subtask Results\s*<\/h[1-6]>/i)[1]?.split(/Islamic Culture Subtask Results\s*<\/h[1-6]>/i)[0] ?? '').map(t => t.map(row => row.map(c => c.text))).find(t => expected.every(h => t[0]?.includes(h)));
    const [headers = [], ...rows] = table ?? [];
    if (!expected.every(h => headers.includes(h)) || rows.length < 9) throw new Error('Missing leaderboard columns or rows');
    return rows.map(cells => {
      const cell = (name: string) => cells[headers.indexOf(name)]?.trim();
      const number = (name: string) => {
        const raw = cell(name)?.replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error('Invalid ' + name + ' for ' + cells[0]);
        return Number(raw);
      };
      const model = cell("Team");
      if (!model) throw new Error('Missing model name');
      return { model, score: number("Accuracy"), submitter: cell('Members'), agentOrg: cell('Affiliation') };
    });
  },
};
export default board;
