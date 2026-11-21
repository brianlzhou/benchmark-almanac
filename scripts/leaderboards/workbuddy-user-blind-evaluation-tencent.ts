// WorkBuddy's user blind evaluation measures satisfaction on everyday office tasks.
// The headline is the four-point satisfaction rating, where higher is better.
// This importer reads Tencent's blind-test chart from the public Hy4 flash article.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checkedImageRows} from '../lib/boards/transcribed-image.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://api.hunyuan.tencent.com/api/blog/publicDetail';
const board: Leaderboard = {benchmark: 'workbuddy-user-blind-evaluation-tencent', url: 'https://huggingface.co/tencent/Hy4-flash#user-blind-evaluation', feed: FEED, static: 'paper', terms: 'Tencent Hy public research article. https://hunyuan.tencent.com/', async fetch() {
  const body = await fetchText(FEED, {method: 'POST', headers: {'content-type': 'application/json', 'accept-language': 'en'}, body: JSON.stringify({customUrl: 'hy4-flash'})});
  const content = JSON.parse(body).data?.detail?.content;
  if (typeof content !== 'string') throw new Error('Tencent Hy4 flash article missing');
  const image = content.match(/盲测结果[^\n]*\]\((https?:[^)]+)\)/)?.[1];
  if (!image) throw new Error('WorkBuddy blind-test chart missing');
  const rows: LeaderboardRow[] = [
    {model: 'DeepSeek-V4.1-Flash-1017', score: 3.09}, {model: 'Hy4 flash', score: 2.79},
    {model: 'Claude Haiku 5.5', score: 2.81}, {model: 'GLM-5.3-Flash', score: 2.53},
  ];
  return checked(await checkedImageRows(image, '518c8ffc455e782e4c91b4ce60242345701f27a959e7849df45c167d7fcd813b', rows), 4);
}};
export default board;
