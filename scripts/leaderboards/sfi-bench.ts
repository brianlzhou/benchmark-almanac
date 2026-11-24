// SFI-Bench tests spatial and functional reasoning over indoor video.
// Figure 5 contains a text table of macro-average accuracy and six task accuracies.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.02130';
const tasks = ['GCT.', 'MPR.', 'LI.', 'FA.', 'OP.', 'TS.'];
const board: Leaderboard = {
  benchmark: 'sfi-bench', static: 'paper', url: feed, feed,
  terms: 'Apple publishes Figure 5 under the terms listed at https://arxiv.org/abs/2605.02130.',
  parts: Object.fromEntries(tasks.map(name => [name, name])),
  aliases: { 'LLaVA-Video-7B': 'llava-video-7b-qwen2', 'LLaVA-Video-72B': 'llava-video-72b-qwen2',
    'GLM-4.5V-Thinking': 'glm-4-5v' },
  async fetch() {
    const table = tables(await paperHtml(feed)).find(t => t[0].map(c => c.text).join('|') === ['Methods', 'Rank', 'Avg.', ...tasks].join('|'));
    if (!table) throw new Error('SFI-Bench Figure 5 columns changed');
    return checked(table.slice(1).filter(row => !row.slice(1).every(c => !c.text)).map(row => {
      const [raw, , average, ...values] = row.map(c => c.text);
      const settings = [];
      if (raw.includes('†')) settings.push('Official API');
      if (raw.includes('‡')) settings.push('Web search for OP and TS');
      if (raw.includes('-High')) settings.push('High reasoning effort');
      const model = raw.replace(/[†‡]/g, '').replace('-High', '').trim();
      return { model, setting: settings.join(', ') || undefined, score: numberCell(average),
        metrics: Object.fromEntries(tasks.map((key, i) => [key, numberCell(values[i])])) };
    }), 25);
  },
};
export default board;
