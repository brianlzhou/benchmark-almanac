// AGI-Eval records the floor reached in nine attempts at the same Slay the Spire 2 seed.
// Each chart prints the mean and all nine floor counts. Check the image before using its transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://agent.csdn.net/6a74244310ee7a33f296fc9a.html';
const charts = [
  { model: 'GPT-5.4', floors: [17, 17, 17, 17, 12, 9, 12, 29, 17],
    url: 'https://i-blog.csdnimg.cn/img_convert/f7c3579cf8dc5cb4834560dc21ba0c24.png',
    hash: '59dc0ecbb5a10609cba888519588f6a0c457d46ebe924fa0651e3fbb6eea0483' },
  { model: 'Claude opus 4.6', floors: [8, 15, 17, 10, 21, 17, 17, 21, 33],
    url: 'https://i-blog.csdnimg.cn/img_convert/614e18bc547291c766703757ec176ceb.jpeg',
    hash: '549e6719181528e288637a34c17ba3c74e9ecae628f5f4f02411fc26e38fad38' },
  { model: 'Claude Opus 4.7', floors: [27, 29, 17, 17, 21, 17, 17, 25, 24],
    url: 'https://i-blog.csdnimg.cn/img_convert/4ccbbb25e5286bd78a35561df321f76d.png',
    hash: '6ef00874e681b360264bab0cea4082c153b0fb6d215b5cc7b91977e353c5f301' },
  { model: 'Doubao', floors: [17, 17, 27, 8, 17, 25, 7, 7, 17],
    url: 'https://i-blog.csdnimg.cn/img_convert/942a9f45e01c603adc6a374e57b9d58a.png',
    hash: 'cea23d64b1968396d9024d18d50c878ffc7a6f6128da4dfcc8f11a7403e76269' },
  { model: 'Deepseek-V4-Flash', floors: [11, 9, 13, 12, 12, 17, 6, 12, 11],
    url: 'https://i-blog.csdnimg.cn/img_convert/5e7de8828f103031ea8cbaf95879b5c3.png',
    hash: 'd84bbef9963a11b084cc92f8ed136ef46c12f711f38c4aea0faf2fb8d1ec8b07' },
];
const board: Leaderboard = {
  benchmark: 'ai-spire-agi-eval', url, feed: url,
  terms: 'AGI-Eval publishes the charts on CSDN without a reuse license. The article robots.txt allows the results page.',
  stats: { attempt1: { name: 'Floor reached on attempt 1', unit: 'count' }, attempt2: { name: 'Floor reached on attempt 2', unit: 'count' }, attempt3: { name: 'Floor reached on attempt 3', unit: 'count' }, attempt4: { name: 'Floor reached on attempt 4', unit: 'count' }, attempt5: { name: 'Floor reached on attempt 5', unit: 'count' }, attempt6: { name: 'Floor reached on attempt 6', unit: 'count' }, attempt7: { name: 'Floor reached on attempt 7', unit: 'count' }, attempt8: { name: 'Floor reached on attempt 8', unit: 'count' }, attempt9: { name: 'Floor reached on attempt 9', unit: 'count' } },
  async fetch() {
    const page = await fetchText(url);
    const rows: LeaderboardRow[] = [];
    for (const chart of charts) {
      if (!page.includes(chart.url)) throw new Error('AI-Spire changed the chart for ' + chart.model);
      const score = Number((chart.floors.reduce((sum, floor) => sum + floor, 0) / chart.floors.length).toFixed(2));
      const metrics = Object.fromEntries(chart.floors.map((floor, i) => ['attempt' + (i + 1), floor]));
      await new Promise(resolve => setTimeout(resolve, 1000));
      rows.push(...await checkedImageRows(chart.url, chart.hash, [{ model: chart.model, score, metrics, trials: chart.floors.length, link: chart.url }]));
    }
    return rows;
  },
};
export default board;
