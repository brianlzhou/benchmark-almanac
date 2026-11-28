// CulturalRiddles: overall human-evaluated accuracy from the official dashboard.
// Reasoning and search configurations remain settings. Exact match and community coverage remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/CohereLabsCommunity/CulturalRiddles/raw/main/index.html";
const board: Leaderboard = {
  benchmark: "culturalriddles",
  stats: {
    activeParams: { name: 'Active parameters', unit: 'billions' },
    evaluatedRiddles: { name: 'Evaluated riddles', unit: 'count' },
    exactMatch: { name: 'Exact match', unit: '%', better: 'higher' },
    hallucinationRate: { name: 'Hallucination rate', unit: '%', better: 'lower' },
  },
  chart: {
    title: 'Hallucination rate vs. accuracy',
    x: { key: 'score', label: 'Human-evaluated accuracy', unit: '%', better: 'higher' },
    y: { key: 'hallucinationRate', label: 'Hallucination rate', unit: '%', better: 'lower' },
    note: 'CulturalRiddles plots hallucination share among labeled answers against overall human-evaluated accuracy.',
  },
  url: "https://huggingface.co/spaces/CohereLabsCommunity/CulturalRiddles/raw/main/index.html",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {'Apertus 70B Instruct':'apertus-70b'},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=jsonAfter<any>(await fetchText(FEED),'const D = adapt(');
      const hallucByModel=new Map<string,number>((d.hallucination??[]).filter((h:any)=>typeof h.pct_hallucinated==='number').map((h:any)=>[h.model_display,h.pct_hallucinated]));
      return d.leaderboard.map((r:any)=>{const size=d.model_sizes?.find((m:any)=>m.model_display===r.model);const halluc=hallucByModel.get(r.model);return {params:typeof size?.model_size_b==='number'?size.model_size_b:undefined,open:size?.access==='proprietary'?false:['open-weight','open-source'].includes(size?.access)?true:undefined,model:r.model.replace(/\s*\[[^\]]+\]$/,''),setting:r.model.match(/\[([^\]]+)\]$/)?.[1]||r.reasoning,score:r.human_accuracy,metrics:{...(typeof size?.active_parameter_count_b==='number'?{activeParams:size.active_parameter_count_b}:{}),exactMatch:r.exact_match,evaluatedRiddles:r.n,...(halluc!==undefined?{hallucinationRate:halluc}:{})}};});
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
