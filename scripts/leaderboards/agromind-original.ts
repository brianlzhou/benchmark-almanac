// AgroMind tests agricultural scene understanding. Version 1 of Table 2 reports overall accuracy on 25,026 questions.
// Tables 3, 6 and 7 break it down by difficulty, answer type and scene. Table 5 identifies the models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,flatPaperTables,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2505.12207v1';
const breakdowns = [
  ['SL','SR','BD','OC','PDD','GSR','SC','CO','AS','VPR','AR','CTR','PL'],
  ['Easy','Medium','Hard'], ['Judgement','Counting','Text Choice','Image Choice','Open-ended'],
  ['Plot','Disease','Fruit','Pest','Tassel','Crop','Anomaly','Oil Palm','Tree Cover'],
];
const board: Leaderboard = {
  benchmark:'agromind-original',url:feed,feed,static:'paper',terms:PAPER_TERMS,
  parts:Object.fromEntries(breakdowns.flat().map(k=>[k,k==='Judgement'?'Judgment':k])),
  aliases:{'LLaVA-NeXT-7B-Mistral':'llava-v1-6-mistral-7b','LLaVA-NeXT-7B-Vicuna':'llava-v1-6-vicuna-7b',
    'LLaVA-NeXT-13B':'llava-v1-6-vicuna-13b','LLaVA-NeXT-34B':'llava-v1-6-34b','LLaVA-NeXT-8B':'llama3-llava-next-8b','Idefics-2-8b':'idefics2-8b'},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const details = tables.find(t=>t[0].join('|')==='Model Family|Model Name|Year|Parameters|Link');
    if (!details) throw new Error('Missing model identifiers');
    const models = new Map<string,LeaderboardRow>();
    for (const [i,keys] of breakdowns.entries()) {
      const header = ['Model',...keys,'Overall'].join('|');
      const t = tables.find(t=>t[i===0?1:0]?.join('|')===header);
      if (!t || (i>0 && t[1].at(-1)!=='(25,026)')) throw new Error('Missing original benchmark breakdown '+header);
      for (const [name,...cells] of t.slice(2)) {
        if (['Human','Random'].includes(name)) continue;
        const model = name.replace(/\s*\[\s*\d+\s*\]$/,'');
        const reference = details.find(r=>r[1]===model);
        const size = reference?.[3]?.match(/^([\d.]+)B$/);
        if (!reference || cells.length!==keys.length+1 || !cells.every(s=>/^\d+(?:\.\d+)?$/.test(s))) throw new Error('Invalid model row '+name);
        const score = Number(cells.at(-1));
        const row = models.get(model) ?? { model,score,params:size?Number(size[1]):undefined,metrics:{} };
        if (row.score!==score) throw new Error('Inconsistent overall scores');
        keys.forEach((k,j)=>{ row.metrics![k] = Number(cells[j]); });
        models.set(model,row);
      }
    }
    if ([...models.values()].some(r=>breakdowns.flat().some(k=>!(k in r.metrics!)))) throw new Error('Missing breakdowns');
    return checked([...models.values()],21);
  },
};
export default board;
