// ZIQI-Eval measures music knowledge. The authors publish average accuracy for zero-shot and five-shot prompts in their README.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = 'https://raw.githubusercontent.com/zcli-charlie/ZIQI-Eval/main/README_EN.md';
const categories = ['作曲理论','世界民族音乐','流行音乐','西方音乐史','中国音乐史','中国传统音乐','音乐美学','音乐教育','音乐表演','女性音乐'];
const board: Leaderboard = {
  benchmark: 'ziqi-eval', url: "https://github.com/zcli-charlie/ZIQI-Eval/blob/main/README_EN.md#leaderboard", feed,
  terms: 'The authors list no repository license. GitHub restricts some crawlers and its raw file host has no robots.txt.',
  aliases: { 'Qwen-7B-base':'qwen-7b', 'Qwen-7B-Base':'qwen-7b', 'Qwen-14B-Base':'qwen-14b', 'Baichuan-7B-Base':'baichuan1-7b',
    'Baichuan-13B-Base':'baichuan-1-13b', 'Baichuan2-7B-Base':'baichuan-2-7b', 'Baichuan2-13B-Base':'baichuan2-13b' },
  parts: Object.fromEntries(categories.map(name => [name,name])),
  async fetch() {
    const tables = markdownTables(await fetchText(feed)).filter(t => t[0].at(-1) === '平均分');
    if (tables.length !== 2) throw new Error('Missing ZIQI-Eval prompt settings');
    return tables.flatMap((table,i) => {
      if (table.length < 17 || categories.some((name,j) => table[0][j+1] !== name)) throw new Error('Incomplete ZIQI-Eval table');
      return table.slice(1).map(r => {
        if (!r[0] || r.length !== 12 || r.slice(1).some(s => !s || !Number.isFinite(Number(s)))) throw new Error('Invalid ZIQI-Eval row');
        return { model:r[0], setting:i === 0 ? 'Zero-shot' : 'Five-shot', score:Number(r[11]),
          metrics:Object.fromEntries(categories.map((name,j) => [name,Number(r[j+1])])) };
      });
    });
  },
};
export default board;
