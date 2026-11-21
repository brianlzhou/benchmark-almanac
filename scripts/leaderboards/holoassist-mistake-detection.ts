// HoloAssist tests mistake detection in egocentric human interaction videos.
// Table 7 reports F-score for TimeSformer features under each sensor modality combination.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2309.17024';
const board: Leaderboard = {
  benchmark: 'holoassist-mistake-detection', static: 'paper',
  stats:{correctPrecision:{name:'Correct precision',unit:'%',better:'higher'},correctRecall:{name:'Correct recall',unit:'%',better:'higher'},mistakePrecision:{name:'Mistake precision',unit:'%',better:'higher'},mistakeRecall:{name:'Mistake recall',unit:'%',better:'higher'}},
  url: 'https://arxiv.org/abs/2309.17024', feed: FEED,
  terms: 'The authors publish the paper under the arXiv terms of use. https://arxiv.org/abs/2309.17024',
  aliases: { TimeSformer: 'timesformer' },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(FEED);
    const figure = html.slice(html.indexOf('<figure id="S5.T7"'), html.indexOf('</figure>', html.indexOf('<figure id="S5.T7"')));
    const plain = figure.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const rows: LeaderboardRow[] = [];
    for (const match of plain.matchAll(/\b(Random|RGB|Hands|R\+H|R\+H\+E)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g)) {
      const [, harness, score, correctPrecision, correctRecall, mistakePrecision, mistakeRecall] = match;
      rows.push({ model: 'TimeSformer', harness, score: Number(score), metrics: { correctPrecision: Number(correctPrecision), correctRecall: Number(correctRecall), mistakePrecision: Number(mistakePrecision), mistakeRecall: Number(mistakeRecall) } });
    }
    if (rows.length !== 5) throw new Error(`Expected five HoloAssist rows, got ${rows.length}`);
    return checked(rows, 5);
  },
};
export default board;
