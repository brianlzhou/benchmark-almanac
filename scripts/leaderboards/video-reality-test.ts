// Video Reality Test reviewer accuracy percentage. Generator failure rates are a distinct lower-is-better measure and are not mixed with reviewer accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://video-reality-test.github.io/";
const board: Leaderboard = {
 benchmark: "video-reality-test",
 url: "https://video-reality-test.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = tables(await fetchText(FEED)).find(t=>t[0].some(c=>c.text==='Model'));
  if (!t) throw new Error('video-reality-test table missing');
  let previousModel = '';
  const rows=t.slice(1).filter(r=>r[0]?.text && !/Human|Random/i.test(r[0].text) && num(r[8]?.text)!==undefined).map(r=>{
    const audio = /^\+ Audio$/i.test(r[0].text);
    const model = audio ? previousModel : r[0].text.replace(/\s*\*$/, '');
    if (!audio) previousModel = model;
    if (!model) throw new Error('Audio row without preceding model');
    return {model, setting:audio ? 'audio enabled' : undefined, score:num(r[8].text)!,
    metrics:Object.fromEntries(t[0].map((h,i)=>[h.text,i!==0 && i!==8?num(r[i]?.text):undefined]).filter((p):p is [string,number]=>typeof p[1]==='number'))
  };});
  if(!rows.length) throw new Error('video-reality-test has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
