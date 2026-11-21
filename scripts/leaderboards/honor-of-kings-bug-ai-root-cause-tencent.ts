// This benchmark tests automated bug root-cause analysis for Honor of Kings code.
// The score is root-cause analysis accuracy, reported as a percentage.
// This importer reads Tencent's Hy4 research article through its public detail API.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://api.hunyuan.tencent.com/api/blog/publicDetail';
const board: Leaderboard = {benchmark: 'honor-of-kings-bug-ai-root-cause-tencent', url: 'https://hunyuan.tencent.com/research/hy4', feed: FEED, terms: 'Tencent Hy public research article. https://hunyuan.tencent.com/', async fetch() {
  const body = await fetchText(FEED, {method: 'POST', headers: {'content-type': 'application/json', 'accept-language': 'en'}, body: JSON.stringify({customUrl: 'hy4'})});
  const content = JSON.parse(body).data?.detail?.content;
  if (typeof content !== 'string') throw new Error('Tencent Hy4 article missing');
  const m = content.match(/Honor of Kings[\s\S]{0,800}?code root-cause analysis accuracy jumped from ([\d.]+)% to ([\d.]+)%/i);
  if (!m) throw new Error('Honor of Kings root-cause result missing');
  return checked([{model: 'Hy4 preview', score: Number(m[1])}, {model: 'Hy4', score: Number(m[2])}], 2);
}};
export default board;
