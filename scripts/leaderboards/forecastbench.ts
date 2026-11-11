// ForecastBench (Forecasting Research Institute). forecastbench.org/leaderboards/ opens on the Tournament
// leaderboard, published as leaderboards/csv/leaderboard_tournament.csv in forecastingresearch/
// forecastbench-datasets. It ranks forecasters by the Overall Brier Index (0 to 100, higher is better),
// preserved as a secondary metric. The headline here is raw Brier Overall, matching the catalog. The tournament mixes external team systems with model runs by the ForecastBench team;
// external systems are retained with their team as harness, alongside the team's own model runs.
// Human and non-model baselines are excluded; LLM Crowd ensembles remain as named systems. Model names carry the run setup after
// the model id ("gpt-5.5-2026-04-23-high-web-search", "claude-sonnet-4-5-20250929-1024",
// "...-scratchpad-with-freeze-values"); those parts become the setting. The publisher defines a trailing
// dagger as ZERO_SHOT_WITH_FREEZE_VALUES in src/llm_forecaster/output.py at
// https://github.com/forecastingresearch/forecastbench/blob/main/src/llm_forecaster/output.py .
// It means zero-shot prompting with crowd forecasts as context, a whole-benchmark run configuration.
// The Baseline leaderboard (no tools, no crowd forecasts) is a separate CSV and is not read here.
// The Overall 95% CI column is kept as metrics.ciLow and ciHigh.
// For duplicate external-system entries, keep the first published row in the default board.
// Sample counts describe coverage, not a run configuration, and remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/forecastingresearch/forecastbench-datasets/main/leaderboards/csv/leaderboard_tournament.csv';

// Run-setup suffixes, matched from the end. Numeric budgets must not consume snapshot tags
// such as 001, 0309, 0709, 0905, 2407, 2411, 2506, or 2507.
const SUFFIX =
  /-(superforecaster-with-news-\d+|with-freeze-values|with-second-news|with-news|scratchpad|web-x-search|web-search|code-execution|cost-optimized|adaptive-thinking|non-reasoning|reasoning|standard|xhigh|high|medium|low|minimal|max|\d+k|1024|2048|4096|8192|16384|32768|65536|[1-9]\d{0,2}000)$/;

/** "gpt-5.5-2026-04-23-high-web-search" -> model gpt-5.5, date 2026-04-23, setting "high, web search". */
export function splitForecastModel(raw: string): { model: string; setting?: string; date?: string } {
  let name = raw.trim();
  const parts: string[] = [];
  if (name.endsWith('†')) {
    name = name.slice(0, -1).trim();
    parts.push('zero shot with crowd forecast');
  }
  for (let m = name.match(SUFFIX); m; m = name.match(SUFFIX)) {
    if (/^gpt-(?:4|3\.5-turbo)-(?:0314|0613|1106|0125)$/.test(name)) break;
    parts.unshift(m[1].replace(/-/g, ' '));
    name = name.slice(0, m.index);
  }
  let date: string | undefined;
  const stamp = name.match(/-(20\d\d)-?(\d\d)-?(\d\d)$/);
  if (stamp) {
    date = `${stamp[1]}-${stamp[2]}-${stamp[3]}`;
    name = name.slice(0, stamp.index);
    for (let m = name.match(SUFFIX); m; m = name.match(SUFFIX)) {
      if (/^gpt-(?:4|3\.5-turbo)-(?:0314|0613|1106|0125)$/.test(name)) break;
    parts.unshift(m[1].replace(/-/g, ' '));
      name = name.slice(0, m.index);
    }
  }
  if (!date) name = unspecified(name);
  return { model: name, setting: parts.length ? parts.join(', ') : undefined, date };
}

const unspecified = (name: string) => /^(?:gpt4o|gpt4|gpt4turbo|gpt4v|gpt35turbo|gemini(?:15|20|25)(?:pro|flash|flashlite|flashthinking)|claude35sonnet|deepseek(?:r1|v3))$/i.test(name.replace(/[- ._]/g, '')) ? `${name} (snapshot unspecified)` : name;

const board: Leaderboard = {
  benchmark: 'forecastbench',
  url: 'https://www.forecastbench.org/leaderboards/',
  feed: `${FEED} (all model systems, Brier Overall)`,
  terms: 'CSV in the forecastingresearch/forecastbench-datasets repository; the site and datasets are CC BY-SA 4.0.',
  aliases: {
    'gpt-4.5-preview': 'gpt-4-5',
    'grok-4.20-0309': 'grok-4-20',
    'grok-4.20-beta-0309': 'grok-4-20',
    'grok-4-0709': 'grok-4',
    'meta-llama-3.1-405b-instruct-turbo': 'llama-3-1-405b',
    'kimi-k2-instruct-0905': 'kimi-k2-sep-2025',
    // the July 2025 model, before the 0905 update
    'kimi-k2-instruct': 'kimi-k2-jul-2025',
    'grok-4.20-beta': 'grok-4-20',
    'qwen3-235b-a22b-fp8-tput': 'qwen3-235b-a22b',
    'llama-4-maverick-17b-128e-instruct-fp8': 'llama-4-maverick',
    'llama-4-scout-17b-16e-instruct': 'llama-4-scout',
    'glm-4.5-air-fp8': 'glm-4-5-air',
    'llama-3.3-70b-instruct-turbo': 'llama-3-3-70b-instruct',
    'qwen2.5-72b-instruct-turbo': 'qwen2-5-72b',
    'llama-3-70b-chat-hf': 'llama-3-70b',
    'llama-3-8b-chat-hf': 'llama-3-8b',
    'llama-2-70b-chat-hf': 'llama-2-70b',
    'qwen1.5-110b-chat': 'qwen1-5-110b',
    'mixtral-8x22b-instruct-v0.1': 'mixtral-8x22b',
    'mixtral-8x7b-instruct-v0.1': 'mixtral-8x7b',
  },
  fetch: () => fetchForecastRows(FEED, 'Brier Overall'),
};
export async function fetchForecastRows(feed: string, metric: 'Overall' | 'Brier Overall' = 'Overall'): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    const data = parseCsv(await fetchText(feed));
    const seen = new Set<string>();
    for (const r of data) {
      if (r['Model Organization'] === 'ForecastBench' && !r.Model?.startsWith('LLM Crowd')) continue;
      const score = Number(r[metric]);
      if (!r.Model || !r[metric]?.trim() || !Number.isFinite(score)) continue;
      // "[68.3, 71.2]": the board's 95% interval on the Overall index
      const ci = r['Overall 95% CI']?.match(/\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/);
      const identity = r.Team === 'ForecastBench' && r['Model Organization'] !== 'ForecastBench'
        ? splitForecastModel(r.Model) : { model: `${r.Model} [${r.Team}]`, harness: r.Team };
      const key = `${r.Model}|${r.Team}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ ...identity, score, metrics: { ...(r.Overall?.trim() ? {brierIndex: Number(r.Overall)} : {}), ...(metric === 'Overall' && ci ? { ciLow: Number(ci[1]), ciHigh: Number(ci[2]) } : {}), ...(r.N?.trim() && Number.isFinite(Number(r.N)) ? { questions: Number(r.N) } : {}) } });
    }
    return rows;
}
export default board;
