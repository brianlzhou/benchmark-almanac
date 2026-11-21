// SuperCLUE-Open compares Chinese multi-turn answers. The ranked table scores a win or tie as a success.
// The README also gives counts, rates, and results for ten abilities.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/CLUEbenchmark/SuperCLUE-Open/HEAD/README.md";

const key = (s: string) => s.toLowerCase().replace('minmax-abab5','minimax-abab5').replace('chatglm2-6b-chat','chatglm2-6b').replace('jiangziya-13b-v1.1','idea-姜子牙-13b').replace(/[（(]预训练模型[）)]/,'');

const board: Leaderboard = {
  benchmark: "superclue-open",
  url: "https://github.com/CLUEbenchmark/SuperCLUE-Open",
  feed: FEED,
  terms: "The repository publishes comparison results. The README does not specify separate reuse terms for these scores. https://github.com/CLUEbenchmark/SuperCLUE-Open",
  async fetch() {
    const tables = markdownTables(await fetchText(FEED));
    const ranked = tables.find(t => t[0].join('|') === '排名|Model|Score|Win|Loss|Tie|Win_rate(%)|Loss_rate(%)');
    const parts = tables.find(t => t[0][1] === '胜和率');
    const meta = tables.find(t => t[0].includes('许可证'));
    if (!ranked || ranked.length < 16 || !parts || parts[0].length !== 12 || !meta) throw new Error('Incomplete SuperCLUE-Open tables');
    this.parts = Object.fromEntries(parts[0].slice(2).map(name => [name,name]));
    return ranked.slice(1).map((cells): LeaderboardRow => {
      const model = cells[1];
      const m = meta.slice(1).find(r => key(r[0]) === key(model));
      const p = parts.slice(1).find(r => key(r[0]) === key(model));
      const nums = cells.slice(2).map(Number);
      if (nums.length !== 6 || !nums.every(Number.isFinite)) throw new Error('Invalid SuperCLUE-Open row');
      const [score,win,loss,tie,winRate,lossRate] = nums;
      const metrics: Record<string,number> = {win,loss,tie,winRate,lossRate};
      if (p) for (let j=2; j<parts[0].length; j++) {
        if (!p[j] || !Number.isFinite(Number(p[j]))) throw new Error('Invalid ability score');
        metrics[parts[0][j]] = Number(p[j]);
      }
      return {model, score, metrics, license: m?.[5], open: m ? m[5].startsWith('开源') : undefined};
    });
  },
};
export default board;
