// CREF ranks forecasts by overall MASE skill relative to seasonal naive. The Space reads a daily ratings snapshot and labels models with its public metadata.
import type { Leaderboard } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';

const url = "https://autogluon-fev-bench.hf.space/cref";
const feed = "https://d2i4i33c3shekq.cloudfront.net/v1/leaderboard/latest.json";

const board: Leaderboard = {
  benchmark: 'cref-forecasting', url, feed,
  stats: {
    coverageSamples: { name: 'Coverage samples', unit: '%', better: 'higher' },
    coverageWeight: { name: 'Coverage weight', unit: '%', better: 'higher' },
    mase_marginal_win_rate: { name: 'Mean absolute scaled error marginal win rate', unit: '%', better: 'higher' },
    mase_skill_score: { name: 'Mean absolute scaled error skill score', unit: '%', better: 'higher' },
    mase_win_rate: { name: 'Mean absolute scaled error win rate', unit: '%', better: 'higher' },
    sql_marginal_win_rate: { name: 'SQL marginal win rate', unit: '%', better: 'higher' },
    sql_skill_score: { name: 'SQL skill score', unit: '%', better: 'higher' },
    sql_win_rate: { name: 'SQL win rate', unit: '%', better: 'higher' },
  },
  terms: "The Space lists Apache 2.0 for code. The archived dataset has custom terms. https://doi.org/10.7910/DVN/B4OOJK" ,
  async fetch() {
    type Metric = {skill_score:number|null; win_rate:number|null; marginal_win_rate:number|null};
    type Entry = {model_id:string; metrics:Record<string,Metric>; missing_samples:number; missing_weight:number|null};
    type Rankings = {rankings:Entry[];sample_count:number;pairwise?:Record<string,Record<string,Record<string,{win_rate:number|null}>>>};
    const data = await fetchJson<{boards:Record<string,Rankings>;timestamp:string}>(feed);
    const meta = await fetchText('https://huggingface.co/spaces/autogluon/fev-bench/raw/main/cref/models.toml');
    const names = new Map([...meta.matchAll(/^\[([\w-]+)\]\s*\n([\s\S]*?)(?=^\[|(?![\s\S]))/gm)].map(m => [m[1],{
      name:m[2].match(/^name = "([^"]+)"/m)?.[1], link:m[2].match(/^url = "(https:[^"]+)"/m)?.[1],
    }]));
    const overall = data.boards.overall;
    if (overall.rankings.length < 26 || !names.size) throw new Error('Incomplete CREF snapshot');
    const parts: Record<string,{name:string;group:string}> = {};
    board.parts = parts;
    const ids = new Set(overall.rankings.map(r => r.model_id));
    return overall.rankings.map(r => {
      const score = r.metrics.mase.skill_score;
      if (score === null || !Number.isFinite(score)) throw new Error('Missing overall MASE skill');
      const metrics: Record<string,number> = {coverageSamples:100*(1-r.missing_samples/overall.sample_count)};
      if (r.missing_weight !== null) metrics.coverageWeight = 100*(1-r.missing_weight);
      for (const [metric, values] of Object.entries(r.metrics)) {
        for (const [k,v] of Object.entries(values)) if (v !== null) metrics[metric+'_'+k] = 100*v;
        const pair = overall.pairwise?.[metric]?.[r.model_id];
        if (pair) {
          const wins = Object.entries(pair).filter(([id,v]) => ids.has(id) && v.win_rate !== null).map(([,v])=>v.win_rate!);
          if (wins.length) metrics[metric+'_marginal_win_rate'] = 100*wins.reduce((a,b)=>a+b,0)/wins.length;
        }
      }
      for (const [key,group] of Object.entries(data.boards)) {
        if (key === 'overall') continue;
        const part = group.rankings.find(p=>p.model_id === r.model_id)?.metrics.mase.skill_score;
        if (part != null) { const [category,name] = key.split('/'); parts[key] = {name,group:category}; metrics[key] = 100*part; }
      }
      const label = names.get(r.model_id);
      return {model:r.model_id === '__baseline__' ? 'Seasonal naive' : label?.name ?? r.model_id, link:label?.link,
        date:data.timestamp.slice(0,10), score:100*score, metrics};
    });
  },
};
export default board;
