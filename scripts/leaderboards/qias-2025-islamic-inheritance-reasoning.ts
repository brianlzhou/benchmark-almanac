// QIAS Task 1 ranks teams by accuracy on Arabic inheritance questions. Its results page embeds the final table as escaped HTML.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://sites.google.com/view/qias2025/leaderboards";
const board: Leaderboard = {
  benchmark: "qias-2025-islamic-inheritance-reasoning",
  url: "https://sites.google.com/view/qias2025/leaderboards",
  feed: FEED,
  terms: "The inheritance table ranks 15 team systems. The organizers reserve all rights on the leaderboard page. https://sites.google.com/view/qias2025/leaderboards The robots file allows this feed for the importer.",
  async fetch() {
    const text = await fetchText(FEED);
    const expected = ["Rank", "\ud83c\udff7\ufe0f Team", "\ud83d\udcca Accuracy", "\ud83c\udf93 Affiliations"];
    const table = tables(text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').split('Task 1 Leaderboard - QIAS2025')[1]?.split('</body>')[0] ?? '').map(t => t.map(row => row.map(c => c.text))).find(t => expected.every(h => t[0]?.includes(h)));
    const [headers = [], ...rows] = table ?? [];
    if (!expected.every(h => headers.includes(h)) || rows.length < 15) throw new Error('Missing leaderboard columns or rows');
    return rows.map(cells => {
      const cell = (name: string) => cells[headers.indexOf(name)]?.trim();
      const number = (name: string) => {
        const raw = cell(name)?.replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error('Invalid ' + name + ' for ' + cells[0]);
        return Number(raw);
      };
      const model = cell("\ud83c\udff7\ufe0f Team");
      if (!model) throw new Error('Missing model name');
      return { model, score: number("\ud83d\udcca Accuracy") * 100, submitter: model, agentOrg: cell('🎓 Affiliations') };
    });
  },
};
export default board;
