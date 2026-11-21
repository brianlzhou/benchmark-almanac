// LongBanana tests image synthesis from many references. The leaderboard scores the human-audited 90-case cohort.
// Overall Avg. is the checklist average on a 0 to 100 scale. Only the P@70% pass rate uses difficulty weights.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://klingairesearch.github.io/LongBanana/';
const feed = url + 'data.js';
const groups = { overall: ['overall', 'p70'], topo: ['overall', 'scc', 'rgc', 'lac'],
  appr: ['overall', 'gac', 'lab', 'ahc'], reason: ['overall', 'sel', 'tsr', 'agg'] };
const board: Leaderboard = {
  benchmark: 'longbanana', url: url + '#leaderboard', feed, harnesses: 'system',
  terms: 'The project licenses its code and documentation under MIT. https://github.com/KlingAIResearch/LongBanana/blob/main/LICENSE',
  aliases: { 'Seedream 4': 'seedream-4-0', 'Nano Banana 2': 'gemini-3-1-flash-image' },
  stats: {p70:{name:'Pass rate at 70% checklist threshold',unit:'%',better:'higher'}},
  parts: { topo: 'Scene Composition', appr: 'Visual Appearance', reason: 'Reference Reasoning',
    scc: 'Semantic Coverage & Consistency', rgc: 'Relational Graph Consistency', lac: 'Layout Arrangement Consistency',
    gac: 'Global Appearance Conditioning', lab: 'Local Appearance Binding', ahc: 'Appearance Harmonization & Coherence',
    sel: 'Selection & Retrieval', tsr: 'Temporal / State Reasoning', agg: 'Counting & Aggregation' },
  async fetch() {
    const source = (await fetchText(feed)).split('window.LB =')[1]?.split('window.LB.meta')[0];
    if (!source?.includes('generator:')) throw new Error('Missing leaderboard datasets');
    const rows = new Map<string, LeaderboardRow>();
    for (const block of source.split(/\{\s*info:\s*\{/).slice(1)) {
      const info = block.match(/^\s*name: '([^']+)', type: '([^']+)', typeLabel: '[^']+', backend: '([^']+)'/);
      if (!info) throw new Error('Missing generator or controller');
      const [, name, type, backend] = info;
      const metrics: Record<string, number> = {};
      for (const [group, keys] of Object.entries(groups)) {
        const cells = block.match(new RegExp('\\b' + group + ':\\s*\\{([^}]+)\\}'))?.[1];
        for (const key of keys) {
          const value = cells?.match(new RegExp('\\b' + key + ':\\s*(\\d+(?:\\.\\d+)?)\\s*(?:,|$)'));
          if (!value) throw new Error('Missing ' + group + '.' + key);
          metrics[key === 'overall' ? group : key] = Number(value[1]);
        }
      }
      const { overall: score, ...other } = metrics;
      const model = type === 'generator' ? name : backend;
      const harness = type === 'generator' ? backend : type === 'direct' ? undefined : name;
      const row = { model, harness, setting: type === 'direct' ? name : undefined, score, metrics: other };
      const key = JSON.stringify([model, harness, row.setting]);
      if (rows.has(key) && JSON.stringify(rows.get(key)) !== JSON.stringify(row)) throw new Error('Conflicting shared condition');
      rows.set(key, row);
    }
    return checked([...rows.values()], 10);
  },
};
export default board;
