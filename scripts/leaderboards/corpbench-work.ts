// CorpBench Work v1.3: official composite score, with mean USD cost per task.
// Median output tokens and latency stay supporting metrics, not mean output-token fields.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://raw.githubusercontent.com/RevensiAI/CorpBench/main/results/work/1.3/report.json";
const board: Leaderboard = {
  "benchmark": "corpbench-work",
  "url": "https://huggingface.co/datasets/revensi/CorpBench",
  "feed": "https://raw.githubusercontent.com/RevensiAI/CorpBench/main/results/work/1.3/report.json",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  aliases: { 'mistral-small-2603': 'mistral-small-4' },
  chart: { title: 'Performance versus cost', x: { key: 'cost', label: 'Mean cost per task', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'CorpBench Score', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {

    const data = await fetchJson<any>(FEED);
    if (data.suiteId !== 'corpbench-work' || !Array.isArray(data.models)) throw new Error('Report schema changed');
    return data.models.filter((m: any) => Number.isFinite(m.corpBenchScore)).map((m: any) => {
      const metrics: Record<string, number> = {};
      if (Number.isFinite(m.costPerTask)) metrics.cost = m.costPerTask;
      for (const key of ['outcomeScore', 'efficiencyScore', 'passRate', 'medianLatencySeconds', 'medianOutputTokens', 'medianInputTokens', 'avgDurationSeconds', 'providerFailureRate', 'scoredRuns']) {
        if (Number.isFinite(m[key])) metrics[key] = m[key];
      }
      for (const [department, values] of Object.entries(m.departmentScores ?? {})) {
        for (const [key, value] of Object.entries(values as object)) if (typeof value === 'number') metrics[`${department}_${key}`] = value;
      }
      const setting = [data.title, m.localSpecs?.quantization, m.localSpecs?.contextLength && `context ${m.localSpecs.contextLength}`].filter(Boolean).join('; ');
      return { model: identity(m.modelId.replace(/^[^/]+\//, '')), score: m.corpBenchScore, setting, harness: m.localSpecs?.runtime ?? 'CorpBench', cost: m.costPerTask, metrics };
    });
  },
};
export default board;
