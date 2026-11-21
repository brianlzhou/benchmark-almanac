// SuperCLUE-Code3 ranks models by difficulty-weighted coding score. Join the two official Markdown tables to retain instruction following and the three difficulty levels.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const url = "https://github.com/CLUEbenchmark/SuperCLUE-Code3";
const feed = "https://raw.githubusercontent.com/CLUEbenchmark/SuperCLUE-Code3/HEAD/README.md";

const board: Leaderboard = {
  benchmark: 'superclue-code3', url, feed,
  terms: "The repository publishes comparison results. The README does not specify separate reuse terms for these scores. https://github.com/CLUEbenchmark/SuperCLUE-Code3" ,
  aliases: { 'ChatGLM3-6B-Chat': 'chatglm3-6b' },
  parts: { easy:'初级难度', medium:'中级难度', hard:'高级难度' },
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const head = tables.find(t => t[0].join('').replace(/\s/g,'').includes('非加权得分'));
    const levels = tables.find(t => t[0].join('').replace(/\s/g,'').includes('初级难度'));
    if (!head || !levels || head.length < 12 || levels.length !== head.length ||
        head[0].map(s=>s.replace(/\s/g,'')).join('|') !== '序号|模型|使用|难度等级加权得分|非加权得分|指令遵循率' ||
        levels[0].slice(4).map(s=>s.replace(/\s/g,'')).join('|') !== '初级难度|中级难度|高级难度') throw new Error('Incomplete SuperCLUE-Code3 tables');
    return head.slice(1).map(r => {
      const d = levels.find(v => v[1] === r[1]);
      if (!d || d[3] !== r[3] || r.length !== 6 || d.length !== 7 || ![...r.slice(3),...d.slice(4)].every(s=>/^\d+(\.\d+)?$/.test(s))) throw new Error('Mismatched scores for ' + r[1]);
      return {model:r[1],score:Number(r[3]),metrics:{unweighted:Number(r[4]),instructionFollowing:Number(r[5]),easy:Number(d[4]),medium:Number(d[5]),hard:Number(d[6])}};
    });
  },
};
export default board;
