// RiskRubric combines six risk dimensions into a model deployment rating. The rankings page’s services API supplies composite scores, grades, platforms and assessment dates.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://riskrubric.ai/api/v1/services?page=1&page_size=50&service_type=ai_model";
interface Item { id:string; model_name:string; name:string; model_version:string; platform_provider:string; grade:string; composite_score:number; scored_at:string; pillar_scores:Record<string,number>; confidence:number }

const board: Leaderboard = {
  benchmark: "riskrubric",
  url: "https://riskrubric.ai/",
  feed: FEED,
  terms: "No feed or reuse license verified. The publisher explains the outage at https://riskrubric.ai/post/announcing-riskrubric. The robots URL returns HTML.",
  parts: { transparency:'Transparency', reliability:'Reliability', security:'Security', privacy:'Privacy', safety_societal:'Safety and societal risk', excessive_agency:'Excessive agency' },
  async fetch() {
    const rows = [], seen = new Set<string>();
    const url = new URL(FEED);
    for (let page=1; ; page++) {
      if (page > 1) await new Promise(resolve => setTimeout(resolve,1000));
      url.searchParams.set('page',String(page));
      const data = await fetchJson<{items:Item[];total:number;page:number}>(url.href);
      if (data.page !== page || !data.items.length || data.total < 43) throw new Error('Incomplete RiskRubric page');
      for (const r of data.items) {
        if (seen.has(r.id) || !r.model_name || !Number.isFinite(r.composite_score) || Object.keys(r.pillar_scores).length !== 6) throw new Error('Invalid RiskRubric assessment');
        seen.add(r.id);
        rows.push({ model:r.model_name, setting:[r.platform_provider || 'Direct API',r.model_version,'Grade '+r.grade].filter(Boolean).join(' / '),
          date:r.scored_at.slice(0,10), score:r.composite_score, link:new URL('/services/'+r.id,FEED).href, metrics:{...r.pillar_scores,confidence:r.confidence} });
      }
      if (rows.length === data.total) return rows;
      if (rows.length > data.total) throw new Error('Inconsistent RiskRubric total');
    }
  },
};
export default board;
