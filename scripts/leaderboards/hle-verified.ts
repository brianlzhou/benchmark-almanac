// Paper Table 2: full revised HLE-Verified accuracy. The subset columns compare raw and revised accuracy and calibration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2602.13964';
export default {
 benchmark:'hle-verified', static: 'paper', parts: {
  revisedSubsetAccuracy: { name: 'Revised subset', group: 'Split' },
},url:'https://arxiv.org/abs/2602.13964',feed,terms:PAPER_TERMS,
 async fetch():Promise<LeaderboardRow[]> {
  const t=inlinePaperTables(await paperHtml(feed)).find(t=>t[1]?.[3]==='Revised: HLE-Verified Full');
  if(!t)throw new Error('HLE-Verified full results missing');
  return checked(t.slice(3).map(r=>({model:r[0].replace('Gemini3-pro','Gemini 3 Pro').replace(/Claude-Opus(4\.[56])/,'Claude Opus $1').replace('-High','').replace('Qwen3-Max-Thinking','Qwen3-Max-Thinking (snapshot unspecified)'),score:num(r[3])!,setting:r[0].endsWith('-High')?'high effort':undefined,metrics:{calibrationError:num(r[4])!,rawHleAccuracy:num(r[1])!,rawCalibrationError:num(r[2])!,accuracyChange:num(r[5])!,rawSubsetAccuracy:num(r[6])!,rawSubsetCalibrationError:num(r[7])!,subsetAccuracyChange:num(r[10])!,revisedSubsetAccuracy:num(r[8])!,revisedSubsetCalibrationError:num(r[9])!}})),3);
 },
} satisfies Leaderboard;
