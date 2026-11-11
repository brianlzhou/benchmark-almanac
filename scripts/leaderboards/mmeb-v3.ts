// MMEB V3 scores recomputed from the current dataset definitions and model JSON files.
// Matches the site: round dataset percentages, average equally, and count missing datasets as zero.
// Reports overall V3-suite performance, the new-only V3 score, modality means, and missing-data counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;

const mean = (v: number[]) => v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length*100)/100 : 0;
const FEED = "https://huggingface.co/api/spaces/VLM2Vec/MMEB-Leaderboard";
const board: Leaderboard = {
  "benchmark": "mmeb-v3",
  "url": "https://huggingface.co/spaces/VLM2Vec/MMEB-Leaderboard",
  "feed": "https://huggingface.co/api/spaces/VLM2Vec/MMEB-Leaderboard",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const base = 'https://huggingface.co/spaces/VLM2Vec/MMEB-Leaderboard/raw/main/';
    const definition = await fetchText(base+'datasets.py');
    const literal = definition.match(/^DATASETS = (\{[\s\S]*?\n\})/m)?.[1];
    if (!literal) throw new Error('Dataset definition missing');
    const datasets = JSON.parse(literal.replace(/#[^\n]*/g,'').replace(/'([^'\\]*)'/g,(_,s)=>JSON.stringify(s)).replace(/,\s*([}\]])/g,'$1')) as Record<string,Record<string,string[]>>;
    await new Promise(r=>setTimeout(r,2000));
    const index = await fetchJson<{siblings:{rfilename:string}[]}>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const file of index.siblings.map(f=>f.rfilename).filter(f=>/^scores\/[^/]+\.json$/.test(f))) {
      await new Promise(r=>setTimeout(r,2000));
      const data = await fetchJson<{metadata:{model_name:string,report_generated_date?:string},metrics:Record<string,Record<string,unknown>>}>(base+file.split('/').map(encodeURIComponent).join('/'));
      const raw = {...data.metrics};
      if (raw.tool || raw.gui || raw.memory) raw.agent = {...raw.tool,...raw.gui,...raw.memory};
      const metrics: Record<string,number> = {}; const all: number[] = [], newer: number[] = []; let missing=0;
      for (const [modality,groups] of Object.entries(datasets)) {
        const values: number[] = []; let absent=0;
        for (const [group,names] of Object.entries(groups)) {
          const groupValues: number[] = [];
          for (const name of names) {
            let v = raw[modality]?.[name];
            if (v && typeof v === 'object') {const obj=v as Record<string,unknown>; v = obj[modality==='visdoc' ? ('ndcg_linear@5' in obj ? 'ndcg_linear@5':'ndcg@5') : 'hit@1'];}
            if (typeof v !== 'number' || !Number.isFinite(v)) {absent++;v=0;}
            const score = Math.round((v as number)*10000)/100;
            groupValues.push(score);values.push(score);all.push(score);
            if (['text','audio','agent'].includes(modality)) newer.push(score);
          }
          metrics[group] = mean(groupValues);
        }
        metrics[`${modality}Overall`] = mean(values); metrics[`${modality}Missing`] = absent; missing+=absent;
      }
      metrics.v3NewOnly = mean(newer);metrics.missingDatasets=missing;metrics.totalDatasets=all.length;
      if (!data.metadata.model_name) throw new Error('Model identity missing');
      rows.push({model:data.metadata.model_name,score:mean(all),setting:'V3 suite; missing datasets count as zero',metrics,date:data.metadata.report_generated_date?.slice(0,10)});
    }
    if (!rows.length) throw new Error('No MMEB model files');
    return rows;
  },
};
export default board;
