// RoTA-Bench success percentages on the frozen 100-task test and separate pilot. Paper API costs use uncached list prices, including agent workflows; output tokens are per completed task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/MAC-AutoML/RoTA-Bench/main/website/assets/paper-data.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "rota-bench",
  url: "https://github.com/MAC-AutoML/RoTA-Bench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  chart: {title:'Cost and performance',x:{key:'cost',label:'Mean API cost',unit:'$',better:'lower',log:true},y:{key:'score',label:'Success rate',unit:'%',better:'higher'},note:'Full 100-task paper estimates at published uncached prices; internal agent workflows included.'},
  async fetch() {
    const paper = await fetchJson<any>(FEED);
    const live = await fetchJson<any[]>('https://raw.githubusercontent.com/MAC-AutoML/RoTA-Bench/main/website/assets/leaderboard.json');
    const key = (s:string) => s.toLowerCase().replace(/[^a-z0-9]/g,'');
    const out: LeaderboardRow[] = paper.table.filter((r:any) => r.method !== 'Human').map((r:any) => {
      const raw = live.find(v => key(v.group.split('/').at(-1)) === key(r.method));
      const priced = paper.api_costs.find((v:any) => key(v.method) === key(r.method));
      const agent = /^(ReAct|Magentic)$/.test(r.method);
      const backbone = agent ? raw?.source_files?.map((s:string) => s.match(/agent(?:_continuation)?[\\/]([^\\/]+)[\\/]/)?.[1]).find(Boolean) : undefined;
      const metrics: Record<string,number> = {finalIoU:r.values[1],meanSteps:r.values[2]};
      const cost = priced?.total_usd != null && priced.tasks > 0 ? priced.total_usd / priced.tasks : undefined;
      if(cost !== undefined) metrics.cost=cost;
      return {model: identity(backbone || r.method), score:r.values[0],setting:'Full 100-task test; paper results',harness:agent?r.method:undefined,cost,tokens:raw?.completion_tokens != null ? raw.completion_tokens/raw.completed : undefined,metrics};
    });
    // The ten-task pilot has its own benchmark and importer.
    if(!out.length) throw new Error('RoTA-Bench results missing');
    return out;
  },
};
export default board;
