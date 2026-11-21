// The source reports no overall score. The headline is the plain mean of the five parts, computed by this importer.
// OBLIQ-Bench tests retrieval for implicit information needs. Tables 2 to 4 give gold NDCG@10
// across all five corpora, alongside additional cutoffs, recall and pooled judgments where available.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const url='https://arxiv.org/html/2605.06235';
const datasets=['Twitter','WildChat','Math','Writing','Congress Hearings'];
const measures=['NDCG@10','NDCG@50','Recall@10','Recall@50','Recall@100'];
const board:Leaderboard={
  benchmark:'obliq-bench',static:'paper',url,feed:url,terms:PAPER_TERMS,
  headline:'The headline is the unweighted mean of gold NDCG@10 across the five search tasks.',
  aliases:{'Qwen3-Embed-0.6B':'qwen3-embedding-0-6b','Qwen3-Embed-4B':'qwen3-embedding-4b'},
  async fetch() {
    const tables=inlinePaperTables(await paperHtml(url));
    const paired=tables.filter(t=>t[1]?.join('|') === 'Dataset|Pipeline|G|P|G|P|@10|@50|@100');
    const congress=tables.find(t=>t[2]?.[0] === 'Congress Hearings' && t[1]?.join('|') === 'Pipeline|@10|@50|@10|@50|@100');
    if (paired.length!==2 || !congress) throw new Error('Missing OBLIQ-Bench results tables');
    const parts:Record<string,BoardPart>={};
    const rows=congress.slice(3).filter(r=>!r[0].startsWith('Oracle')).map(([pipeline,...scores])=>{
      const metrics:Record<string,number>={};
      function record(group:string,judgment:string,name:string,raw:string) {
        const key=group+' '+judgment+' '+name;
        parts[key]={name:judgment+' '+name,group,unit:'score'};
        metrics[key]=numberCell(raw.replace(/^\./,'0.'));
      }
      scores.forEach((s,i)=>record('Congress Hearings','Gold',measures[i],s));
      for (const t of paired) for (const [group,label,...cells] of t.slice(2)) {
        if (label!==pipeline) continue;
        if (!datasets.includes(group) || cells.length!==7) throw new Error('Unexpected OBLIQ task');
        for (const [i,name] of measures.entries()) {
          const values=i<2 ? cells.slice(2*i,2*i+2) : cells[i+2].split('/');
          record(group,'Gold',name,values[0]);
          if (group!=='Writing') record(group,'Pooled',name,values[1]);
        }
      }
      const values=datasets.map(d=>metrics[d+' Gold NDCG@10']);
      if (!values.every(Number.isFinite)) throw new Error('Incomplete tasks for '+pipeline);
      const agent=pipeline.startsWith('GPT-5.2 ');
      return {model:agent?'GPT-5.2':pipeline,harness:agent?pipeline.slice(8):undefined,
        score:values.reduce((a,b)=>a+b,0)/5,metrics};
    });
    board.parts=parts;
    return checked(rows,7);
  },
};
export default board;
