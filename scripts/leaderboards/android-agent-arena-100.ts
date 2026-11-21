// Android Agent Arena ranks agents on 100 Android tasks by overall success rate. The project page's table also reports essential states achieved and both measures by task group.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://yxchai.com/Android-Agent-Arena/";
const groups = ['Easy', 'Medium', 'Hard', 'Operation', 'Inf. Query'];

const board: Leaderboard = {
  benchmark: "android-agent-arena-100",
  url: "https://yxchai.com/Android-Agent-Arena/",
  feed: FEED,
  terms: "The authors license the project website under CC BY-SA 4.0. https://yxchai.com/Android-Agent-Arena/ The robots.txt URL serves HTML.",
  parts: Object.fromEntries(groups.flatMap((name) => [
    ['sr' + name, { name, group: 'Success Rate (SR)' }],
    ['esar' + name, { name, group: 'Essential State Achieved Rate (ESAR)' }],
  ])),
  stats: {
    overallEsar: { name: 'Overall essential state achieved rate', unit: '%', better: 'higher' },
  },
  aliases: { 'Qwen2.5-VL': 'qwen2-5-vl-7b' },
  async fetch() {
    const table = tables(await fetchText(FEED)).find((t) => t[0]?.[2]?.text === 'Overall SR');
    if (!table || table[0][3]?.text !== 'Overall ESAR' || table[1].map((c) => c.text).join('|') !== [...groups, ...groups].join('|')) throw new Error('Unexpected Android Agent Arena columns');
    const rows = table.slice(2).map((cells) => {
      const [agent, size, ...numbers] = cells.map((c) => c.text);
      const values = numbers.map(Number);
      if (!agent || values.length !== 12 || numbers.includes('') || !values.every(Number.isFinite)) throw new Error('Incomplete agent row');
      const names = agent.split(' + ');
      const metrics: Record<string, number> = { overallEsar: values[1] };
      for (const [index, group] of groups.entries()) {
        metrics['sr' + group] = values[index + 2];
        metrics['esar' + group] = values[index + 7];
      }
      return { model: names.at(-1)!, harness: names.length > 1 ? names[0] : undefined,
        params: /^\d+B$/.test(size) ? parseInt(size) : undefined, score: values[0], metrics };
    });
    if (rows.length < 10) throw new Error('Expected ten agent configurations');
    return rows;
  },
};
export default board;
