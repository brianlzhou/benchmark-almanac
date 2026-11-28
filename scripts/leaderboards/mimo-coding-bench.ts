// MiMo Coding Bench: the original V2.5-Pro launch evaluation.
// This is distinct from MiMo Code Bench in the V2.6 report. Join scores to model names, parameter counts and open-weight flags.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://mimo.xiaomi.com/mimo-v2-5-pro/index.html";
const board: Leaderboard = {
  benchmark: "mimo-coding-bench",
  url: "https://mimo.xiaomi.com/mimo-v2-5-pro/index.html",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  stats: { activeParamsB: { name: 'Active parameters', unit: 'billions' } },
  
  async fetch() {
    const s=await fetchText(FEED);
    const block=s.match(/const benchModels = \[([\s\S]*?)\];/)?.[1];
    if(!block)throw new Error('MiMo model labels missing');
    const models=Object.fromEntries([...block.matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)].map(m=>[m[1],m[2]]));
    const scores=s.match(/name: 'MiMo Coding Bench',[\s\S]*?scores:\s*\{([^}]+)\}/)?.[1];
    if(!scores)throw new Error('MiMo Coding Bench scores missing');
    const specs = new Map<string, { open: boolean; params?: number; metrics?: Record<string, number> }>();
    const list = s.match(/const fbModels = \[([\s\S]*?)\];/)?.[1] ?? '';
    for (const match of list.matchAll(/\{[^{}]*name:\s*'([^']+)'([^{}]*)\}/g)) {
      const open = match[2].match(/\bos:\s*(true|false)/);
      if (!open) continue;
      const size = match[2].match(/params:\s*'([\d.]+)([TB])\s*\/\s*([\d.]+)B'/);
      specs.set(match[1], {
        open: open[1] === 'true',
        ...(size ? {params: Number(size[1]) * (size[2] === 'T' ? 1000 : 1), metrics: {activeParamsB: Number(size[3])}} : {}),
      });
    }
    return [...scores.matchAll(/(\w+):\s*([\d.]+)/g)].map(m => ({
      model: models[m[1]], score: Number(m[2]), ...specs.get(models[m[1]]),
    }));
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
