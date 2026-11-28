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
  stats: {
    'HIP-to-HIPGeoMean': { name: 'HIP-to-HIP geometric mean speedup', unit: 'speedup', better: 'higher' },
    'HIP-to-HIPCompiled': { name: 'HIP-to-HIP compilation rate', unit: '%', better: 'higher' },
    'HIP-to-HIPCorrect': { name: 'HIP-to-HIP correctness rate', unit: '%', better: 'higher' },
    'HIP-to-HIPScore': { name: 'HIP-to-HIP mean score', unit: 'score', better: 'higher' },
    'HIP-to-HIPFast1': { name: 'HIP-to-HIP fast 1 rate', unit: '%', better: 'higher' },
    'HIP-to-HIPFast2': { name: 'HIP-to-HIP fast 2 rate', unit: '%', better: 'higher' },
    'HIP-to-HIPOutputTokens': { name: 'HIP-to-HIP output tokens', unit: 'tokens' },
    'HIP-to-HIPP25': { name: 'HIP-to-HIP 25th percentile speedup', unit: 'speedup' },
    'HIP-to-HIPP75': { name: 'HIP-to-HIP 75th percentile speedup', unit: 'speedup' },
    'HIP-to-HIPP90': { name: 'HIP-to-HIP 90th percentile speedup', unit: 'speedup' },
    'Triton-to-TritonGeoMean': { name: 'Triton-to-Triton geometric mean speedup', unit: 'speedup', better: 'higher' },
    'Triton-to-TritonCompiled': { name: 'Triton-to-Triton compilation rate', unit: '%', better: 'higher' },
    'Triton-to-TritonCorrect': { name: 'Triton-to-Triton correctness rate', unit: '%', better: 'higher' },
    'Triton-to-TritonScore': { name: 'Triton-to-Triton mean score', unit: 'score', better: 'higher' },
    'Triton-to-TritonFast1': { name: 'Triton-to-Triton fast 1 rate', unit: '%', better: 'higher' },
    'Triton-to-TritonFast2': { name: 'Triton-to-Triton fast 2 rate', unit: '%', better: 'higher' },
    'Triton-to-TritonOutputTokens': { name: 'Triton-to-Triton output tokens', unit: 'tokens' },
    'Triton-to-TritonP25': { name: 'Triton-to-Triton 25th percentile speedup', unit: 'speedup' },
    'Triton-to-TritonP75': { name: 'Triton-to-Triton 75th percentile speedup', unit: 'speedup' },
    'Triton-to-TritonP90': { name: 'Triton-to-Triton 90th percentile speedup', unit: 'speedup' },
    'PyTorch-to-HIPGeoMean': { name: 'PyTorch-to-HIP geometric mean speedup', unit: 'speedup', better: 'higher' },
    'PyTorch-to-HIPCompiled': { name: 'PyTorch-to-HIP compilation rate', unit: '%', better: 'higher' },
    'PyTorch-to-HIPCorrect': { name: 'PyTorch-to-HIP correctness rate', unit: '%', better: 'higher' },
    'PyTorch-to-HIPScore': { name: 'PyTorch-to-HIP mean score', unit: 'score', better: 'higher' },
    'PyTorch-to-HIPFast1': { name: 'PyTorch-to-HIP fast 1 rate', unit: '%', better: 'higher' },
    'PyTorch-to-HIPFast2': { name: 'PyTorch-to-HIP fast 2 rate', unit: '%', better: 'higher' },
    'PyTorch-to-HIPOutputTokens': { name: 'PyTorch-to-HIP output tokens', unit: 'tokens' },
    'PyTorch-to-HIPP25': { name: 'PyTorch-to-HIP 25th percentile speedup', unit: 'speedup' },
    'PyTorch-to-HIPP75': { name: 'PyTorch-to-HIP 75th percentile speedup', unit: 'speedup' },
    'PyTorch-to-HIPP90': { name: 'PyTorch-to-HIP 90th percentile speedup', unit: 'speedup' },
  },
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
        distribution[0].slice(3).forEach((name,j)=>{row.metrics![task+name.replace(/\s+/g,'')]=parseFloat(dist[j+3]);});
        groups.set(key,row);
      }
    }
    const total = counts.reduce((a,b)=>a+b,0);
    return checked([...groups.values()].map(row=>{
      const mean = (suffix:string)=>tasks.reduce((s,t,i)=>s+counts[i]*row.metrics![t+suffix],0)/total;
      return {...row,score:mean(''),tokens:Math.round(mean('OutputTokens'))};
    }),8);
  },
};
export default board;
