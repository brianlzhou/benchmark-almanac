// LongVideoBench: Test Total is the test-set accuracy percentage. The project’s static table
// contains more configurations than the legacy Space CSV. Frame limits, duration splits and validation accuracy are retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://longvideobench.github.io/";
const board: Leaderboard = {
 benchmark: "longvideobench",
 parts: {
   'Test 8s-15s': { name: 'Test 8 to 15 seconds', group: 'Split' },
   'Test 15s-60s': { name: 'Test 15 to 60 seconds', group: 'Split' },
   'Test 180s-600s': { name: 'Test 180 to 600 seconds', group: 'Split' },
   'Test 900s-3600s': { name: 'Test 900 to 3600 seconds', group: 'Split' },
   'Val Total (1337)': { name: 'Validation', group: 'Split' },
 },
 url: "https://longvideobench.github.io",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases: {'Phi-3-Vision-Instruct':'phi-3-vision-128k-instruct','BLIP-2-T5-XXL':'blip2-flan-t5-xxl','LLaVA-1.5-7B':'llava-v1-5-7b',VideoLLaVA:'video-llava-7b'},
 async fetch(): Promise<LeaderboardRow[]> {
  const t = tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Model (max_frames)'));
  if(!t) throw new Error('LongVideoBench table missing');
  return t.slice(1).filter(r=>num(r[3]?.text)!==undefined).map(r=>{
    let model=r[1].text; const frames=model.match(/\s*\((\d+)\)$/);
    if(frames) model=model.slice(0,frames.index).trim();
    const snap=model.match(/\s*\((\d\d)(\d\d)\)$/);
    const date=snap?`2024-${snap[1]}-${snap[2]}`:undefined;
    if(snap) model=model.slice(0,snap.index).trim();
    const rank = num(r[0]?.text);
    const size = model.match(/[- ](\d+(?:\.\d+)?)B\b/i);
    return {model,open:r[2]?.text === 'Yes' ? true : r[2]?.text === 'No' ? false : undefined,
      params:size ? Number(size[1]) : undefined,score:num(r[3].text)!,date,setting:frames?`max_frames=${frames[1]}`:undefined,
      metrics:{...(rank === undefined ? {} : { rank }), ...(frames ? { maxFrames: Number(frames[1]) } : {}), ...Object.fromEntries([4,5,6,7,8].filter(i=>num(r[i]?.text)!==undefined).map(i=>[t[0][i].text,num(r[i].text)!]))}};
  });
 },
};
export default board;
