// AgentKernelArena measures GPU kernel optimization. Tables 2 to 4 give mean speedup by task category.
// The paper defines mean speedup as the “arithmetic mean of per-task speedup ratios across all tasks”.
// Weight the three published means by their task counts. Table 8 reports dispersion and Table 9 gives output tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,paperTables,checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2605.16819';
const tasks = ['HIP-to-HIP','Triton-to-Triton','PyTorch-to-HIP'];
const parts = Object.fromEntries(tasks.map(name=>[name,{name,unit:'speedup' as const}]));
const board: Leaderboard = {
  benchmark:'agentkernelarena-amd',url:feed,feed,static:'paper',terms:PAPER_TERMS,parts,
  headline:'Mean speedup weights the three published category means by their task counts across all 196 tasks.',
  aliases:{'Opus 4.6':'claude-opus-4-6','Opus 4.7':'claude-opus-4-7','Sonnet 4.6':'claude-sonnet-4-6'},
  async fetch() {
    const html = await paperHtml(feed);
    const all = paperTables(html).map(grid);
    const tokens = all.find(t=>t[0].join('|') === ['Agent','Model',...tasks].join('|'));
    const distribution = all.find(t=>t[0].join('|') === 'Category|Agent|Model|Task Std|P25|P75|P90');
    if (!tokens || !distribution) throw new Error('Missing appendix metrics');
    const groups = new Map<string,LeaderboardRow>();
    const figures = [...html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].map(m=>m[0]);
    const counts:number[] = [];
    for (const [i,task] of tasks.entries()) {
      const figure = figures.find(f=>text(f.match(/<figcaption[\s\S]+?<\/figcaption>/)?.[0] ?? '').includes(task+' results ('));
      const count = Number(figure && text(figure).match(/results \((\d+) tasks, 3 runs/)?.[1]);
      if (!figure || !count) throw new Error('Missing task count: '+task);
      counts.push(count);
      const t = grid(paperTables(figure)[0]);
      if (t[0].slice(0,4).join('|')!=='Agent|Model|Comp. %|Corr. %' || !t[0][4].startsWith('Mean Spd.') || !t[0][6].startsWith('Geo. Mean')) throw new Error('Missing speedup columns');
      for (const [harness,label,compiled,correct,mean,points,geomean,fast1,fast2] of t.slice(1)) {
        const key = harness+'|'+label;
        const row = groups.get(key) ?? {model:label.replace(/ High$/,''),harness,setting:label.endsWith(' High')?'High':undefined,score:0,metrics:{},trials:3};
        const arithmetic = mean.match(/^([\d.]+) \\pm ([\d.]+) \\times$/);
        const geo = geomean.match(/^([\d.]+) \\pm ([\d.]+) \\times$/);
        const tok = tokens.find(r=>r[0]===harness && r[1]===label);
        const dist = distribution.find(r=>r[0].replace(/\s/g,'')===task && r[1]===harness && r[2]===label);
        if (!arithmetic || !geo || !tok || !dist) throw new Error('Incomplete results for '+key);
        Object.assign(row.metrics!,{[task]:Number(arithmetic[1]),[task+'Std']:Number(arithmetic[2]),[task+'GeoMean']:Number(geo[1]),
          [task+'GeoStd']:Number(geo[2]),[task+'Compiled']:Number(compiled),[task+'Correct']:Number(correct),[task+'Score']:Number(points),
          [task+'Fast1']:Number(fast1),[task+'Fast2']:Number(fast2),[task+'OutputTokens']:Number(tok[i+2])*1000});
        distribution[0].slice(3).forEach((name,j)=>{row.metrics![task+name]=parseFloat(dist[j+3]);});
        groups.set(key,row);
      }
    }
    const total = counts.reduce((a,b)=>a+b,0);
    return checked([...groups.values()].map(row=>{
      const mean = (suffix:string)=>tasks.reduce((s,t,i)=>s+counts[i]*row.metrics![t+suffix],0)/total;
      row.metrics!.outputTokens = mean('OutputTokens');
      return {...row,score:mean('')};
    }),8);
  },
};
export default board;
