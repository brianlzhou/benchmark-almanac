import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/facebookresearch/worldsense/main/README.md';
const board: Leaderboard = {
 benchmark: 'worldsense', url: 'https://github.com/facebookresearch/worldsense', feed: FEED,
 terms: 'Official public repository. The almanac credits Meta and links the original source.',
 async fetch() {
  const readme = await fetchText(FEED);
  const block = readme.split('AVERAGE ACCURACY ACROSS ALL PROBLEMS')[1]?.split('ACCURACY for each')[0];
  if (!block) throw new Error('WorldSense aggregate table missing');
  const rows = [...block.matchAll(/^([\w.+-]+)\s+(\d+\.\d+)\s+\(([\d.]+)\)/gm)].map(m => {
   const model = /GPT/.test(m[1]) ? `${m[1]} (snapshot unspecified)` : `${m[1]} (size unspecified)`;
   const score = Number(m[2]), ci = Number(m[3]);
   return {model, score, setting: 'basic prompting', metrics: {ciLow: score-ci, ciHigh: score+ci}};
  });
  if (!rows.length) throw new Error('WorldSense aggregate rows missing');
  return rows;
 },
};
export default board;
