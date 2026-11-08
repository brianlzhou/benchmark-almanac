// MobileGym on mobilegym.dev. The page is static HTML whose first table ranks models on four task levels,
// grouped under label rows (proprietary, GUI-specialized open models, open generalist models): Model |
// L1 (20) | L2 (73) | L3 (83) | L4 (80) | SR. The overall success rate SR (0 to 100) is the score. The reader
// retains all scored models and four level metrics, skipping one-cell group labels.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://mobilegym.dev/';

const board: Leaderboard = {
  benchmark: 'mobilegym',
  url: URL,
  feed: `${URL} (leaderboard table, SR)`,
  terms: 'Static public page; robots.txt allows all paths for generic agents with a content signal, and the site publishes no terms.',
  aliases: {},
  async fetch() {const t=tables(await fetchText(URL))[0];if(t?.[0]?.at(-1)?.text!=='SR')throw new Error('Missing MobileGym table');return t.slice(1).flatMap(r=>{const score=num(r[5]?.text);if(score===undefined)return [];return [{model:r[0].text,score,setting:'Test set; 256 tasks',metrics:Object.fromEntries([1,2,3,4].map(i=>[`L${i}`,num(r[i].text)!]))}];});},
};
export default board;
