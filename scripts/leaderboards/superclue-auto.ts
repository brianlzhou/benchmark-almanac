// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// The SuperCLUE-Auto README rates Chinese automotive assistants by capability and gives two conversation-round scores.
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const url = 'https://github.com/CLUEbenchmark/SuperCLUE-Auto';
const feed = 'https://raw.githubusercontent.com/CLUEbenchmark/SuperCLUE-Auto/HEAD/README.md';
const parts = ['智能座舱与交互','汽车营销','车辆使用指南','汽车理解通用知识'];
function table(section: string, header: string[]) {
  const lines = section.split('\n').filter(l => l.startsWith('|')).map(l =>
    l.split('|').slice(1,-1).map(c => c.replace(/<br\s*\/?\s*>|\*\*/gi,'').trim()));
  if (lines[0]?.join('|') !== header.join('|')) throw new Error('SuperCLUE-Auto table changed');
  return lines.slice(2);
}
export default {
  benchmark: 'superclue-auto', url, feed, terms: 'Public author-published results at ' + url,
  headline: 'The README reports no overall score. The headline is the plain mean of its four capability scores.',
  parts: Object.fromEntries([...parts,'第一轮','第二轮'].map(k => [k,k])),
  async fetch() {
    const md = await fetchText(feed);
    const [abilities, rounds] = (md.split('### SuperCLUE-Auto四大能力与应用')[1] ?? '').split('### SuperCLUE-Auto第一二轮得分分解表');
    if (!rounds) throw new Error('Missing score tables');
    const perRound = table(rounds,['序号','模型名称','第一轮','第二轮','分数差异']);
    const key = (s: string) => s.replace(/-/g,'');
    const rows = table(abilities,['序号','模型','机构',...parts]).map(([,model,,...cells]) => {
      const round = perRound.find(r => key(r[1]) === key(model));
      if (!round || cells.length !== 4) throw new Error('Missing scores for ' + model);
      const raw = [...cells,...round.slice(2)];
      if (!raw.every(v => /^-?\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid score for ' + model);
      const values = raw.map(Number);
      return { model, score: values.slice(0,4).reduce((a,b) => a+b,0)/4,
        metrics: Object.fromEntries([...parts,'第一轮','第二轮','分数差异'].map((p,i) => [p,values[i]])) };
    });
    return checked(rows,12);
  },
} satisfies Leaderboard;
