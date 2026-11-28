// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// FoamBench V2 tests physically successful OpenFOAM cases. The site's bench-data JSON provides Basic and Advanced success rates.
// Each backend has two Foam-Agent runs. Two coding agents use their own harnesses. The site's 2025 comparisons use the earlier evaluation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/nithinsomu/cfdllmbench_v2/main/index.html';
type Split = Record<string, number>;
type Results = { basic: Split; advanced: Split };
type Data = { v2_models: { name: string; foam: { old: Results; new: Results } }[]; agents: { name: string; foam: Results }[] };
const board: Leaderboard = {
  benchmark: 'foambench-2', harnesses: 'system', url: 'https://nithinsomu.github.io/cfdllmbench_v2/#results', feed,
  terms: 'The authors publish FoamBench V2 results and request attribution. https://nithinsomu.github.io/cfdllmbench_v2/#data',
  aliases: { 'Opus 5.5': 'claude-opus-5-5', 'Llama 4 Maverick 17B Instruct': 'llama-4-maverick' },
  parts: { basic: 'Basic', advanced: 'Advanced' },
  stats: {
    basic_M_exec: { name: 'Basic execution score', unit: '%', better: 'higher' },
    basic_M_struct: { name: 'Basic structural score', unit: '%', better: 'higher' },
    basic_M_file: { name: 'Basic file score', unit: '%', better: 'higher' },
    basic_M_NMSE: { name: 'Basic normalized mean squared error', unit: '%', better: 'lower' },
    advanced_M_exec: { name: 'Advanced execution score', unit: '%', better: 'higher' },
    advanced_M_struct: { name: 'Advanced structural score', unit: '%', better: 'higher' },
    advanced_M_file: { name: 'Advanced file score', unit: '%', better: 'higher' },
    advanced_M_NMSE: { name: 'Advanced normalized mean squared error', unit: '%', better: 'lower' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const block = html.match(/<script type="application\/json" id="bench-data">([\s\S]*?)<\/script>/);
    if (!block) throw new Error('Missing FoamBench data');
    const data: Data = JSON.parse(block[1]);
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string | undefined, harness: string, results: Results) {
      const metrics: Record<string, number> = {};
      for (const split of ['basic', 'advanced'] as const) {
        for (const field of ['Success_Rate', 'M_exec', 'M_struct', 'M_file', 'M_NMSE']) {
          const value = results[split]?.[field];
          if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid ' + split + ' ' + field + ' for ' + model);
          metrics[field === 'Success_Rate' ? split : split + '_' + field] = 100 * value;
        }
      }
      rows.push({ model, setting, harness, metrics, score: (metrics.basic + metrics.advanced) / 2 });
    }
    for (const { name, foam } of data.v2_models) {
      const model = name.replace(' (effort=low)', '');
      const setting = name.includes('effort=low') ? 'Low reasoning effort' : /^(GLM 5\.2|Qwen3\.8-27B)$/.test(name) ? 'Thinking off' : undefined;
      add(model, setting, 'Foam-Agent 1.0', foam.old);
      add(model, setting, 'Foam-Agent 2.0', foam.new);
    }
    for (const { name, foam } of data.agents) {
      const match = name.match(/^(.+) \(([^,]+), effort=low\)$/);
      if (!match) throw new Error('Unknown coding agent ' + name);
      add(match[2], 'Low reasoning effort', match[1], foam);
    }
    return checked(rows, 14);
  },
};
export default board;
