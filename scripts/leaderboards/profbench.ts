// ProfBench (NVIDIA). The nvidia/ProfBench Space opens on its Report Generation leaderboard, built from
// report_generation.jsonl in the Space repository and sorted by Overall: the share of expert rubric criteria
// a model's reports meet, judged by an LLM grader (0 to 100). Overall is the score. "Output Tokens" is the
// mean output length of one report and is kept as tokens. "Cost" is the board's US-dollar estimate for the
// whole run of 160 reports (OpenRouter token prices times the run's tokens), kept as cost with costPer 'run'.
// Keep the report-generation setup with documents as a separate setting. Names carry the vendor and the reasoning effort ("OpenAI/GPT-5 (high)"), which the resolver splits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/nvidia/ProfBench/resolve/main/report_generation.jsonl';

const domains = ['Physics', 'Chemistry', 'Finance', 'Consulting'];
const dimensions = ['Extraction', 'Reasoning', 'Style'];
interface Row {
  [key: string]: string | number | undefined;
  Category?: string;
  Model?: string;
  Overall?: number;
  'Output Tokens'?: number;
  Cost?: number;
}

const board: Leaderboard = {
  benchmark: 'profbench',
  url: 'https://huggingface.co/spaces/nvidia/ProfBench',
  feed: `${FEED} (Overall)`,
  terms: 'JSON lines file in the nvidia/ProfBench Hugging Face Space, licensed MIT.',
  parts: Object.fromEntries([...domains, ...dimensions].map(name => [name, { name, group: domains.includes(name) ? 'Domain' : 'Rubric' }])),
  costPer: 'run',
  // keys without the vendor prefix, so they also apply after the resolver splits off "(Thinking)"
  aliases: {
    // the stable releases: the board names the September 2025 previews "-Preview-09-2025" when it has them
    'Gemini-2.5-Flash': 'gemini-2-5-flash-jun-2025',
    'Gemini-2.5-Flash-Lite': 'gemini-2-5-flash-lite-jun-2025',
    'grok-4-0709': 'grok-4',
    'grok-4.20 Beta': 'grok-4-20',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
    M2: 'minimax-m2',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const withDocs of [false, true]) {
      if (withDocs) await new Promise(resolve => setTimeout(resolve, 1050));
      const url = withDocs ? FEED.replace('generation.jsonl', 'generation_w_docs.jsonl') : FEED;
      for (const line of (await fetchText(url)).split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line) as Row;
      if (!r.Model || typeof r.Overall !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const key of [...domains, ...dimensions, 'Input Tokens', 'Response Characters']) {
        if (typeof r[key] === 'number') metrics[key] = r[key];
      }
      const effort = r.Model.match(/\(([^)]+)\)$/)?.[1] ?? r.Category?.split(' ').at(-1);
      rows.push({ metrics, setting: [effort, withDocs ? 'with documents' : undefined].filter(Boolean).join('; ') || undefined,
        open: r.Category?.startsWith('Open-weight') ? true : r.Category?.startsWith('Closed-source') ? false : undefined,
        model: r.Model.trim(), score: r.Overall, tokens: r['Output Tokens'], cost: typeof r.Cost === 'number' ? r.Cost : undefined });
    }
    }
    return rows;
  },
};
export default board;
