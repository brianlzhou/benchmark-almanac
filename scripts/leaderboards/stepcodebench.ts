// StepCodeBench: the release page’s current JavaScript bundle contains the chart’s model scores.
// The importer discovers the bundle each time, then reads avg@4 percentages and reasoning efforts as data.
// Bar widths are presentation values and are not used as scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://www.stepfun.com/step-5-preview";
const board: Leaderboard = {
 benchmark: "stepcodebench",
 url: "https://www.stepfun.com/step-5-preview",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const html=await fetchText(FEED);
  const src=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>new URL(m[1],FEED)).find(u=>u.hostname==='www.stepfun.com' && /^\/assets\/index-[\w-]+\.js$/.test(u.pathname));
  if(!src)throw new Error('Step release bundle missing');
  await new Promise(resolve=>setTimeout(resolve,1100));
  const js=await fetchText(src.href);
  const section=js.match(/title:"StepCodeBench",rows:\[([\s\S]*?)\]\}/)?.[1];
  if(!section)throw new Error('StepCodeBench chart data missing');
  const rows:LeaderboardRow[]=[];
  for(const m of section.matchAll(/model:"([^"]+)"[^}]*?value:"([\d.]+)"/g)){
    const effort=m[1].match(/\s*\((High|Max|Medium|Low)\)$/i);
    rows.push({model:effort?m[1].slice(0,effort.index):m[1],score:Number(m[2]),setting:'avg@4'+(effort?'; '+effort[1].toLowerCase():'')});
  }
  if(!rows.length)throw new Error('StepCodeBench has no model scores');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
