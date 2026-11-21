// BioBasicsBench tests whether agents can interpret raw experimental evidence in 100 wet-lab tasks.
// Mean reward is the percentage of rubric credit earned across five attempts per task at xhigh reasoning effort.
// This importer reads the seven-model results table in OpenAI's benchmark article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = 'https://openai.com/index/measuring-how-ai-agents-handle-wet-lab-science/';
const board: Leaderboard = {
  benchmark: 'biobasicsbench', url: FEED, feed: FEED,
  terms: 'OpenAI publishes the article publicly. Link and attribute the source.',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(FEED)).find((rows) => rows[0]?.map((cell) => cell.text).join('|') === 'Model|Mean reward|95% CI|Output tokens / task');
    if (!table || table.length !== 8) throw new Error('BioBasicsBench results table missing or incomplete');
    const rows = table.slice(1).map((cells) => {
      const model = cells[0].text.replaceAll('‑', '-');
      const score = num(cells[1].text);
      const interval = [...cells[2].text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
      const tokens = Number(cells[3].text.replaceAll(',', ''));
      if (!model || score === undefined || interval.length !== 2 || interval.some((value) => !Number.isFinite(value)) || !Number.isFinite(tokens)) throw new Error('Invalid BioBasicsBench result');
      return { model, score, setting: 'xhigh reasoning effort', low: interval[0], high: interval[1], tokens };
    });
    return rows;
  },
};
export default board;
