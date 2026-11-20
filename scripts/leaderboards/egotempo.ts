import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2503.13646';
const board: Leaderboard = {
  benchmark: 'egotempo', parts: {
  AS: { name: 'Action sequence', group: 'Task type' },
  AC: { name: 'Action counting', group: 'Task type' },
  TE: { name: 'Temporal event ordering', group: 'Task type' },
  FU: { name: 'Future action prediction', group: 'Task type' },
  OA: { name: 'Object-specific actions', group: 'Task type' },
  OS: { name: 'Object sequence', group: 'Task type' },
  OC: { name: 'Object counting', group: 'Task type' },
  SR: { name: 'Spatial relations', group: 'Task type' },
  LO: { name: 'Locating objects', group: 'Task type' },
  AO: { name: 'Action-specific objects', group: 'Task type' },
}, url: URL, feed: URL + ' (Table 3 average accuracy)', terms: PAPER_TERMS,
  aliases: {"Qwen2-VL-72B": "qwen2-vl-72b-instruct", "LLaVA-OneVision-Qwen2-72B": "llava-onevision-72b", "LLaVA-OneVision-Qwen2-7B": "llava-onevision-7b"},
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[0] === 'Model' && t[0]?.[1] === '# Frames' && t[0]?.at(-1) === 'Avg');
    if (!t) throw new Error('EgoTempo results missing');
    return t.slice(1).filter(r => /^\d/.test(r.at(-1)!) && r[0] !== 'Random Chance').map(r => ({
      model: paperModel(r[0].replace(/\s*\[\s*\d+\s*\]/g, '')), score: Number(r.at(-1)), setting: `frames: ${r[1]}`,
      metrics: Object.fromEntries(r.slice(2, -1).map((s, i) => [t[0][i + 2], Number(s)])),
    }));
  },
};
export default board;
