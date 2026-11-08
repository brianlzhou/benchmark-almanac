// DiscoX: the official overall table combines both translation directions and all seven domains.
// Overall is the published sum of accuracy, fluency and appropriateness rubric points, not a percentage.
// The three rubric parts are metrics. Names without a specific model snapshot remain unlisted.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const PAGE = 'https://randomtutu.github.io/DiscoX/';
const board: Leaderboard = {
  benchmark: 'discox', url: PAGE, feed: PAGE,
  terms: 'The authors publish this public GitHub Pages table, with attribution retained and no separate score reuse license stated.',
  async fetch() {
    const table = tables(await fetchText(PAGE)).find(t => t.length > 1 && t[0][2]?.text === 'Overall' && t[0][3]?.text === 'Accuracy');
    if (!table) throw new Error('DiscoX overall table missing');
    return table.slice(1).filter(r => r[1]?.text && num(r[2]?.text) !== undefined).map(r => {
      let model = r[1].text;
      const effort = model.match(/-(high|T)$/);
      const setting = effort ? (effort[1] === 'T' ? 'thinking' : 'high') : undefined;
      if (effort) model = model.slice(0, effort.index);
      if (/^(?:GPT-4o|Gemini-2\.5-(?:Pro|Flash-Lite)|Kimi-K2|DeepSeek-(?:R1|V3)|Claude-4|Qwen-3-235B|Doubao-1\.6)$/i.test(model)) model += ' (snapshot unspecified)';
      return { model, setting, score: num(r[2].text)!, metrics: {
        accuracy: num(r[3].text)!, fluency: num(r[4].text)!, appropriateness: num(r[5].text)!,
      } };
    });
  },
};
export default board;
