// RecreationBench (Qwen, RecreationWorld). recreation-bench.cc renders its leaderboard in the browser from
// data/leaderboard.json: per model the reasoning effort, the estimated cost per task and, over the five
// platforms, the programmatic score (prog), the VLM judge score (vlm) and their mean (average, 0 to 1). The
// page ranks by that average, which is the score here (times 100). Effort is the setting and the estimated
// cost per task is kept. Each scored configuration retains its platform breakdown and token limits.
import type { BoardStat, Leaderboard, LeaderboardRow} from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://recreation-bench.cc/data/leaderboard.json';

interface Model {
  name: string;
  primary?: boolean;
  effort?: string;
  estimated_cost_usd_per_task?: number;
  context_window?: string;
  max_output_tokens?: string;
  variant?: string;
  scores?: Record<string, Record<string, number | null>>;
  overall?: Record<string, number | null>;
}

const recreationStats: Record<string, BoardStat> = {
  linuxProg: { name: 'Linux programmatic score', unit: '%', better: 'higher' as const }, macosProg: { name: 'macOS programmatic score', unit: '%', better: 'higher' as const }, windowsProg: { name: 'Windows programmatic score', unit: '%', better: 'higher' as const }, androidProg: { name: 'Android programmatic score', unit: '%', better: 'higher' as const }, webProg: { name: 'Web programmatic score', unit: '%', better: 'higher' as const },
  linuxVlm: { name: 'Linux vision-language model judge score', unit: '%', better: 'higher' as const }, macosVlm: { name: 'macOS vision-language model judge score', unit: '%', better: 'higher' as const }, windowsVlm: { name: 'Windows vision-language model judge score', unit: '%', better: 'higher' as const }, androidVlm: { name: 'Android vision-language model judge score', unit: '%', better: 'higher' as const }, webVlm: { name: 'Web vision-language model judge score', unit: '%', better: 'higher' as const },
  progGe90: { name: 'Overall programmatic score at least 90', unit: '%', better: 'higher' as const }, linuxProgGe90: { name: 'Linux programmatic score at least 90', unit: '%', better: 'higher' as const }, macosProgGe90: { name: 'macOS programmatic score at least 90', unit: '%', better: 'higher' as const }, windowsProgGe90: { name: 'Windows programmatic score at least 90', unit: '%', better: 'higher' as const }, androidProgGe90: { name: 'Android programmatic score at least 90', unit: '%', better: 'higher' as const }, webProgGe90: { name: 'Web programmatic score at least 90', unit: '%', better: 'higher' as const },
  progEq100: { name: 'Overall programmatic score equal to 100', unit: '%', better: 'higher' as const }, linuxProgEq100: { name: 'Linux programmatic score equal to 100', unit: '%', better: 'higher' as const }, macosProgEq100: { name: 'macOS programmatic score equal to 100', unit: '%', better: 'higher' as const }, windowsProgEq100: { name: 'Windows programmatic score equal to 100', unit: '%', better: 'higher' as const }, androidProgEq100: { name: 'Android programmatic score equal to 100', unit: '%', better: 'higher' as const },
  linux: { name: 'Linux average score', unit: '%', better: 'higher' as const }, macos: { name: 'macOS average score', unit: '%', better: 'higher' as const }, windows: { name: 'Windows average score', unit: '%', better: 'higher' as const }, android: { name: 'Android average score', unit: '%', better: 'higher' as const }, web: { name: 'Web average score', unit: '%', better: 'higher' as const },
  contextWindow: { name: 'Context window', unit: 'tokens' }, maxOutputTokens: { name: 'Maximum output tokens', unit: 'tokens' },
};

const board: Leaderboard = {
  benchmark: 'recreationbench',
  url: 'https://recreation-bench.cc/#leaderboard',
  feed: `${FEED} (overall.average)`,
  terms: 'JSON file the recreation-bench.cc page loads; the site publishes no robots.txt and no terms, and the results come from the RecreationWorld paper repository.',
  stats: recreationStats,
  parts: { prog:'Programmatic', vlm:'VLM judge' },
  aliases: {},
  chart: {
    title: 'Cost and benchmark performance',
    note: 'The board compares its overall average score with estimated API cost per task, assuming 90% cache reads.',
    x: { key: 'cost', label: 'Mean cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Overall average score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const { models, platforms } = await fetchJson<{ models: Model[], platforms: { id:string, name:string }[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const avg = m.overall?.average;
      if (!m.name || typeof avg !== 'number') continue;
      const metrics: Record<string, number> = {};
      const suffixes: Record<string,string> = { prog:'Prog', vlm:'Vlm', prog_ge90:'ProgGe90', prog_eq100:'ProgEq100' };
      for (const [column,suffix] of Object.entries(suffixes)) {
        const overall = m.overall?.[column];
        if (typeof overall === 'number') metrics[suffix[0].toLowerCase()+suffix.slice(1)] = overall*100;
        for (const p of platforms) {
          const value = m.scores?.[p.id]?.[column];
          if (typeof value === 'number') metrics[p.id+suffix]=value*100;
        }
      }
      for (const p of platforms) {
        const scores = m.scores?.[p.id];
        if (typeof scores?.prog !== 'number' || typeof scores.vlm !== 'number') continue;
        metrics[p.id] = (scores.prog + scores.vlm) * 50;
        board.parts![p.id] = {name:p.name,group:'Platform'};
      }
      for (const [key, label] of [['contextWindow',m.context_window],['maxOutputTokens',m.max_output_tokens]] as const) {
        const match = label?.match(/^([\d.]+)([km]?)$/i);
        if (match) metrics[key]=Number(match[1])*({k:1000,m:1000000}[match[2].toLowerCase()] ?? 1);
      }
      rows.push({ metrics,
        model: m.name.trim(),
        score: avg * 100,
        setting: [m.effort, m.variant].filter(Boolean).join('; ') || undefined,
        cost: m.estimated_cost_usd_per_task,
      });
    }
    return rows;
  },
};
export default board;
