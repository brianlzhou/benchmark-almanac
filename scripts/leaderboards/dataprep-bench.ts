// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// DataPrep-Bench tests training-data preparation. Track 1 tables A to D report downstream test scores
// for six domains after training each target model on the generators' data.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://datapreparationbench.github.io/';
const domains = ['Math','General','Finance','Law','Medical','Science'];
const labels = [
  ['GSM8K','AMC23','AIME24','M-Math','OB','M500','GK24','Math','MMLU-R','General','CPA-KQA','FinEval-KR','XFinBench','Finance'],
  ['LegalBench','LexGLUE','Law','MedCaseR.','MedMCQA','MedR-Bench','Medical','MMLU-STEM','MMLU-Pro','GPQA','SuperGPQA','ChemBench','PIQA','SciBench','Science'],
];
const board: Leaderboard = {
  benchmark:'dataprep-bench',url,feed:url,
  terms:'The authors publish these results at https://datapreparationbench.github.io/.',
  aliases:{'Gemini 3.0 Pro':'gemini-3-pro'},
  headline:'The site reports no overall score for data construction. The headline averages its six downstream domain scores.',
  parts:Object.fromEntries(labels.flat().map(name=>[name,name])),
  async fetch() {
    const html = await fetchText(url);
    const rows: LeaderboardRow[] = [];
    for (const [tab,target] of [['t1-qwen','Qwen2.5-7B'],['t1-llama','Llama-3.1-8B']]) {
      const pane = html.split('id="' + tab + '"')[1];
      if (!pane) throw new Error('Missing target model ' + target);
      const pair = tables(pane).slice(0,2);
      const joined = new Map<string, LeaderboardRow>();
      for (const [i,table] of pair.entries()) {
        const keys = labels[i];
        const columns = table[1].map(c=>c.text);
        if (columns.join('|') !== keys.map(k=>domains.includes(k)?'Avg':k).join('|')) throw new Error('Changed generator columns');
        let group = '';
        for (const row of table.slice(2)) {
          const [label,...cells] = row.map(c=>c.text);
          if (label.endsWith(" Generators") && cells.every(v=>!v)) { group=label; continue; }
          if (label==='No synthetic training' || group==='DataFlow-based Generators') continue;
          if (cells.length!==keys.length || cells.some(v=>!/^\d+(\.\d+)?$/.test(v))) throw new Error('Invalid result for '+label);
          const skill = label.match(/^Skill \((.+)\)$/);
          const model = skill?.[1] ?? label;
          const harness = skill ? 'Data-Construction-Skill' : group==='Agent-based Generators' ? 'ReAct' : undefined;
          const key = JSON.stringify([model,harness]);
          const result = joined.get(key) ?? {model,harness,setting:'Training '+target,score:0,metrics:{}};
          Object.assign(result.metrics!,Object.fromEntries(keys.map((k,j)=>[k,Number(cells[j])])));
          joined.set(key,result);
        }
      }
      for (const row of joined.values()) {
        const values = domains.map(k=>row.metrics![k]);
        if (!values.every(Number.isFinite)) throw new Error('Missing domain for '+row.model);
        row.score = values.reduce((a,b)=>a+b,0)/domains.length;
        rows.push(row);
      }
    }
    return checked(rows,20);
  },
};
export default board;

