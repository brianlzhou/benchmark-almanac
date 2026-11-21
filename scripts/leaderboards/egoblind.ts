// EgoBlind ranks video models by overall accuracy on questions from blind users. The authors’ results table
// gives six category scores, video settings and the underlying language model.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/doc-doc/EgoBlind/main/README.md";
const board: Leaderboard = {
  benchmark: 'egoblind',
  url: "https://github.com/doc-doc/EgoBlind#benchmarking",
  feed,
  terms: "The raw file host has no robots.txt. The data license covers processed data and annotations under CC BY-NC 4.0. The authors give no separate terms for the results table. https://github.com/doc-doc/EgoBlind/blob/main/LICENSE",
  async fetch() {
    const source = await fetchText(feed);
    const section = source.split('## Benchmarking')[1]?.split('\n## ')[0];
    if (!section) throw new Error('Missing EgoBlind benchmark table');
    const links = new Map([...section.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map(m => [m[1],m[2]]));
    const table = markdownTables(section.replace(/^\s*(\[[^\n]+\|)\s*$/gm, '| $1'))[0];
    const columns = ['Tool Use','Information','Navigation','Safety','Communication','Resource'];
    if (table?.[0].join('|') !== ['Methods','LLM','Res.','#F',...columns,'Overall'].join('|')) throw new Error('Unexpected EgoBlind columns');
    board.parts = Object.fromEntries(columns.map((name,i) => ['category'+i,name]));
    const rows = table.slice(1).filter(r=>r[0] !== 'Human').map(([model, backbone, resolution, frames, ...values]) => {
      if (!model || values.length !== 7 || values.some(v=>!v || !Number.isFinite(Number(v)))) throw new Error('Incomplete EgoBlind result');
      const metrics = Object.fromEntries(columns.map((_,i)=>['category'+i,Number(values[i])]));
      const setting = [backbone === '-' ? '' : backbone, 'Resolution ' + resolution, '#F ' + frames].filter(Boolean).join(', ');
      return { model, score: Number(values[6]), setting, metrics, link: links.get(model) };
    });
    if (rows.length < 16) throw new Error('Expected 16 vision models');
    return rows;
  },
};
export default board;
