// CHI-Bench pass@1 percentages from the live static leaderboard. Only all-domain scores become rows; domain scores remain metrics. The launch page supplies exact cost labels for 30 configurations in its SVG chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://www.actava.ai/benchmarks/leaderboards";
const board: Leaderboard = {
 benchmark: "chi-bench",
 url: "https://www.actava.ai/benchmarks/leaderboards",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 chart: { title: 'Cost versus pass@1', x: { key: 'cost', label: 'Average cost per trial', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'Pass@1', unit: '%', better: 'higher' } },
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const html=await fetchText(FEED);const rows:LeaderboardRow[]=[];
for(const chunk of html.split('<div class="grid items-center transition-colors').slice(1)){
 const m=chunk.match(/class="px-3 py-3 leading-tight"[^>]*>([\s\S]*?)<\/div><div class="px-3 py-3"[^>]*>([\s\S]*?)<\/div>/);if(!m)continue;
 const values=[...chunk.matchAll(/>([\d.]+)%<\/(?:span|div)>/g)].map(m=>Number(m[1]));
 const overall=chunk.match(/w-\[46px\][^>]*>([\d.]+)%/);const score=overall?Number(overall[1]):values[0];if(!overall||score===undefined)continue;
 rows.push({model:text(m[2]),harness:text(m[1]),score,date:chunk.match(/>(\d{4}-\d\d-\d\d)<\/div>/)?.[1],metrics:overall?Object.fromEntries(values.slice(1,4).map((v,i)=>[['priorAuthorization','utilizationManagement','careManagement'][i],v])):undefined});}
if(!rows.length)throw new Error('CHI rows missing');return rows;
  })();
  await new Promise(resolve => setTimeout(resolve, 1100));
  const launch = await fetchText('https://actava.ai/benchmarks');
  const chart = launch.match(/<svg[^>]*aria-label="Cost against pass@1[^>]*>([\s\S]*?)<\/svg>/)?.[1];
  if (!chart) throw new Error('CHI-Bench cost chart missing');
  const normalize = (name: string) => name.toLowerCase().replace(/^ds /, 'deepseek ').replace(/^(opus|sonnet|haiku) /, 'claude $1 ').replace(/^oai agents$/, 'openai agents').replace(/[^a-z0-9]/g, '');
  let costs = 0;
  for (const match of chart.matchAll(/<title>([^<]+)<\/title>/g)) {
    const label = text(match[1]);
    const parsed = label.match(/^(.+?) (?:· (.+?)|\((.+?)\)): ([\d.]+)% at \$([\d.]+)$/);
    if (!parsed) continue;
    const [, model, harness1, harness2, score, cost] = parsed;
    const row = result.find(r => normalize(r.model) === normalize(model) && normalize(r.harness ?? '') === normalize(harness1 || harness2) && Math.abs(r.score - Number(score)) < 0.01);
    if (row) { row.cost = Number(cost); (row.metrics ??= {}).cost = Number(cost); costs++; }
  }
  if (!costs) throw new Error('CHI-Bench cost labels did not match leaderboard rows');
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
