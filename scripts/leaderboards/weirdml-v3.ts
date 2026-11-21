// WeirdML v3: the page's summary table and plot load assets/data/weirdml_v3.json. Each model entry has
// "score", the average score across the 11 tasks (0 to 1, shown with three decimals), its coding agent
// ("codex_cli", "claude_code", ...) and its reasoning effort. Its 95% "interval" for the score is kept as
// low and high (0 to 100). Keep task configurations, usage and run counts.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://htihle.github.io/assets/data/weirdml_v3.json';

interface Model {
  id: string;
  name: string;
  agent?: string;
  release_date?: string;
  reasoning_effort?: string;
  synthetic?: boolean;
  open_weights?: boolean;
  runs?: number;
  mean_final_best?: number;
  configurations: Record<string, {score:number; n:number; final_best?:number; mean_api_cost_usd?:number; mean_output_tokens?:number; mean_tokens?:number}>;
  score: number;
  /** The 95% interval of the score, 0 to 1. */
  interval?: [number, number] | null;
  /** Mean API cost and output tokens for one run of one task. */
  mean_api_cost_usd?: number | null;
  mean_output_tokens?: number | null;
}

const board: Leaderboard = {
  benchmark: 'weirdml-v3',
  url: 'https://htihle.github.io/weirdml.html',
  feed: FEED,
  terms: "Data file of the author's public GitHub Pages site, which states no license or terms.",
  aliases: {},
  stats: {
    meanFinalBest: { name: 'Mean final best score', unit: '%', better: 'higher' }, totalTokens: { name: 'Total tokens', unit: 'tokens' },
    ...Object.fromEntries(['shapesGeneralize','splashGeneralize','mysteryBox','mysteryBoxNohints','shipDetect','shipTune','reactionRates','reactionRatesNohints','scanStitch','scanStitchNohints','shatteredPrior','shatteredPriorNohints','nightSchool','todPipelineNohints','weirdmlBonanza'].flatMap(key => [
      [`${key}FinalBest`, { name: `${key} final best score`, unit: '%', better: 'higher' }],
      [`${key}Trials`, { name: `${key} trials`, unit: 'count' }],
      [`${key}Cost`, { name: `${key} mean API cost`, unit: 'usd', better: 'lower' }],
      [`${key}OutputTokens`, { name: `${key} output tokens`, unit: 'tokens' }],
      [`${key}TotalTokens`, { name: `${key} total tokens`, unit: 'tokens' }],
    ])),
  },
  async fetch() {
    const { models, configurations } = await fetchJson<{ models: Model[]; configurations:{id:string;name:string;hint_mode?:string}[] }>(FEED);
    board.parts = {};
    return models
      .filter((m) => !m.synthetic && Number.isFinite(m.score))
      .map((m) => {
        // "Inkling (xhigh, Together)": effort, then the inference provider when there is one
        const paren = m.name.match(/\s*\(([^()]*)\)\s*$/);
        const parts = paren ? paren[1].split(',').map((s) => s.trim()) : [];
        const provider = parts.slice(1).join(', ');
        const ci = Array.isArray(m.interval) && m.interval.every(Number.isFinite) ? m.interval : undefined;
        const metrics: Record<string, number> = {};
        let tokenSum = 0, tokenRuns = 0;
        if (typeof m.mean_final_best === 'number') metrics.meanFinalBest = m.mean_final_best * 100;
        for (const config of configurations) {
          const c = m.configurations[config.id];
          if (!c || !Number.isFinite(c.score)) continue;
          const key = config.id.replace(/[_-]+(.)/g, (_, char: string) => char.toUpperCase());
          board.parts![key] = {name:config.name, group:config.hint_mode || 'Task'};
          metrics[key] = c.score * 100;
          if (typeof c.final_best === 'number') metrics[key+'FinalBest'] = c.final_best * 100;
          for (const [suffix,value] of Object.entries({Trials:c.n, Cost:c.mean_api_cost_usd, OutputTokens:c.mean_output_tokens, TotalTokens:c.mean_tokens})) {
            if (typeof value === 'number' && Number.isFinite(value)) metrics[key+suffix] = value;
          }
          if (typeof c.mean_tokens === 'number' && c.n > 0) {
            tokenSum += c.mean_tokens * c.n;
            tokenRuns += c.n;
          }
        }
        if (tokenRuns > 0 && tokenRuns === m.runs) metrics.totalTokens = tokenSum / tokenRuns;
        return {
          model: paren ? m.name.slice(0, paren.index).trim() : m.name,
          score: m.score * 100,
          setting: m.reasoning_effort ?? parts[0],
          harness: [m.agent, provider && `via ${provider}`].filter(Boolean).join(' ') || undefined,
          open: m.open_weights, trials: m.runs,
          cost: m.mean_api_cost_usd ?? undefined,
          tokens: m.mean_output_tokens ?? undefined,
          low: ci ? ci[0] * 100 : undefined, high: ci ? ci[1] * 100 : undefined, metrics,
        };
      });
  },
};
export default board;
