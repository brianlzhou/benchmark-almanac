// Corr2Cause tests whether causal claims follow from correlations and independences. Tables 4 and 5
// report F1 on valid claims. Tables 5, 12, and 13 also cover perturbations, relations, and query wording.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2306.05836';
const measures = ['F1','Precision','Recall','Accuracy'];
const relationTypes = ['Is-Parent', 'Is-Ancestor', 'Is-Child', 'Is-Descendant', 'Has-Collider', 'Has-Confounder'];
const board: Leaderboard = {
  benchmark:'corr2cause', url:feed, feed, static:'paper',
  terms:'Results credited to Zhijing Jin and colleagues. https://arxiv.org/abs/2306.05836',
  aliases:{'GPT-3 Davinci':'gpt-3-175b-davinci','GPT-3 Instruct (text-davinci-002)':'davinci-002','GPT-3 Instruct (text-davinci-003)':'davinci-003'},
  stats:{ precision:{name:'Precision',unit:'%',better:'higher'}, recall:{name:'Recall',unit:'%',better:'higher'}, accuracy:{name:'Accuracy',unit:'%',better:'higher'} },
  parts:Object.fromEntries(relationTypes.flatMap(relation => measures.slice(1).map(measure => [`${relation}: ${measure}`, { name:`${relation}: ${measure}`, unit:'%' }]))),
  async fetch() {
    const html = await paperHtml(feed);
    // The paper nests the fine-tuning panels inside a larger figure. Read each panel's own tabular element.
    const ts = [...html.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)].flatMap(m=>flatPaperTables(m[1]).map(grid));
    const base = ts.find(t=>t[1]?.[0]==='Random Baselines');
    const tuned = ts.find(t=>t[0]?.includes('Precison') && t[1][0].startsWith('Finetuned'));
    const perturb = ts.find(t=>t[0]?.join('|')==='F1 (Paraph.)|F1 (Var. Ref.)');
    const fine = ts.find(t=>t[0]?.join('|')===['Selected Models','Relation Type',...measures].join('|'));
    const query = ts.find(t=>t[1]?.[0]?.startsWith('GPT-3.5 (plain query'));
    if (!base || !tuned || !perturb || !fine || !query || base[0].slice(1).join('|')!==measures.join('|')) throw new Error('Missing Corr2Cause table');
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    function add(model:string,setting:string,values:string[]) {
      if (values.length!==4) throw new Error('Missing F1, precision, recall or accuracy');
      const [score,precision,recall,accuracy] = values.map(numberCell);
      const metrics:Record<string,number> = {precision,recall,accuracy};
      rows.push({model,setting,score,metrics});
      return metrics;
    }
    for (const [model,...values] of base.slice(1)){
      if (!values[0] || values[0]===model || /^(Always Majority|Random)/.test(model)) continue;
      add(model,'Original query',values);
    }
    let i = 1;
    for (const [model,...values] of tuned.slice(1)){
      if (values[0]===model) continue;
      const metrics = add(model,'Fine-tuned',values);
      const p = perturb[i++];
      if (p?.length!==2) throw new Error('Missing aligned perturbation row');
      for(const [j,name] of ['Paraphrase','Variable refactorization'].entries()){
        metrics[name] = numberCell(p[j]); board.parts![name]={name,unit:'%'};
      }
    }
    if (i!==perturb.length) throw new Error('Unaligned perturbation panels');
    for (const [model,relation,...values] of fine.slice(1)) {
      if (relation==='All') continue;
      const row = rows.find(r=>r.model===model && r.setting==='Original query');
      if (!row || values.length!==4) throw new Error('Unmatched relation row');
      measures.forEach((m,j)=>{ const name=relation+': '+m; row.metrics![name]=numberCell(values[j]); if(j===0) board.parts![name]={name,unit:'%'}; });
    }
    const enhanced = query.find(r=>r[0]==='GPT-3.5 (enhanced query)');
    if (!enhanced) throw new Error('Missing enhanced query result');
    add('GPT-3.5','Enhanced query',enhanced.slice(1));
    return checked(rows,35);
  },
};
export default board;
