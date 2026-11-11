// HumanEvalPack: use Synthesizing Code multilingual pass@1, the task this record describes.
// Fixing and explaining scores remain metrics. Read literal arrays without executing the notebook.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/bigcode-project/octopack/HEAD/visuals/plots.ipynb";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "humanevalpack",
  url: "https://github.com/bigcode-project/octopack",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const nb = await fetchJson<{cells: {source: string[]}[]}>(FEED);
    const cell = nb.cells.map(c => c.source.join('')).find(s => /MODEL_TO_RES/.test(s) && /Fixing Code/.test(s) && /Synthesizing Code/.test(s));
    if (!cell) throw new Error('HumanEvalPack plotting cell missing');
    const arrays = new Map<string, number[]>();
    for (const m of cell.matchAll(/^([a-z0-9_]+_scores)\s*=\s*(\[[\d.,\s]+\])/gm)) arrays.set(m[1], JSON.parse(m[2]));
    const block = cell.match(/MODEL_TO_RES\s*=\s*\{([\s\S]*?)\}/)?.[1] ?? '';
    const out: LeaderboardRow[] = [];
    for (const m of block.matchAll(/^\s*"([^"]+)":\s*(\w+)/gm)) {
      const scores = arrays.get(m[2]); if (!scores || scores.length !== 3) continue;
      scores.forEach((score, i) => out.push({model: identity(m[1]), score, setting: ['Fixing Code', 'Explaining Code', 'Synthesizing Code'][i]}));
    }
    if (!out.length) throw new Error('HumanEvalPack score arrays missing');
    return out.filter(r => r.setting === 'Synthesizing Code').map(r => ({...r,setting:undefined,
      metrics:Object.fromEntries(out.filter(x => x.model===r.model && x.setting!=='Synthesizing Code')
        .map(x => [x.setting==='Fixing Code' ? 'fixing' : 'explaining',x.score]))}));
  },
};
export default board;
