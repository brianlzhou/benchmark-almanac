// Fab AI tests how models support students with special educational needs. Its page embeds overall percentage accuracy.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://www.fab-ai.org/benchmarks?benchmark=SEND&cost=10&models=%5B%5D&pageView=table";
type Result = { benchmark_domain: string; modelId: string; accuracy: number; n: number | null; bad_format: number | null; categories: { name: string; value: string | null }[] };
export async function fabCore(board: Leaderboard, url: string, domain: string, minimum: number) {
  const source = await fetchText(url);
  const marker = 'originalData:[';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('Missing Fab AI chart data');
  // Svelte serializes fractions without a leading zero. Normalize numeric literals outside strings.
  const literal = source.slice(start + marker.length - 1).replace(/("(?:[^"\\]|\\.)*")|([:,])(-?)\.(\d+)/g,
    (whole, quoted, prefix, sign, digits) => quoted ? whole : prefix + sign + '0.' + digits);
  const results = jsLiteral<Result[]>(literal, 0).filter(r => r.benchmark_domain === domain);
  const models = new Map([...source.matchAll(/"(\d+)":\{id:"\1",name:"[^"]+",displayName:("(?:[^"\\]|\\.)*")/g)]
    .map(m => [m[1], JSON.parse(m[2]) as string]));
  if (results.length < minimum) throw new Error('Incomplete Fab AI rows for ' + domain);
  const overall = results.filter(r => r.categories.every(c => c.value === null));
  if (overall.length < minimum || new Set(overall.map(r => r.modelId)).size !== overall.length) throw new Error('Incomplete overall standings');
  return overall.map(r => {
    const model = models.get(r.modelId);
    if (!model || !Number.isFinite(r.accuracy)) throw new Error('Invalid Fab AI score');
    const metrics: Record<string, number> = {};
    if (r.n !== null) metrics.items = r.n;
    if (r.bad_format !== null) metrics.badFormat = r.bad_format;
    for (const sub of results.filter(s => s.modelId === r.modelId)) {
      const categories = sub.categories.filter(c => c.value !== null);
      if (categories.length !== 1) continue;
      const { name, value } = categories[0];
      const key = name + '_' + value;
      metrics[key] = sub.accuracy;
      (board.parts ??= {})[key] = { name: value!, group: name };
    }
    const setting = model.match(/(?:Adaptive Thinking|Thinking \(\w+\))$/i)?.[0];
    return { model, setting, score: r.accuracy, metrics };
  });
}


export const fabAliases = {
  "Claude-3.5 Sonnet June": "claude-3-5-sonnet",
  "Claude-3.5 Sonnet October": "claude-3-5-sonnet-october-2024",
  "Mistral Large November": "mistral-large-2-nov-2024",
  "Mistral Small 3.1 24B": "mistral-small-3-1",
  "Deepseek R1 (May '25)": "deepseek-r1-may-2025",
  "Command-R+ August": "command-r-plus",
  "Command A": "cohere-command-a",
  "LearnLM 1.5 Pro": "learnlm-1-5-pro-experimental",
  "LFM2.5-1.2B": "lfm2-5-1-2b-instruct",
  "Olmo-3.1 32B": "olmo-3-1-32b-instruct",
  "Claude-3.7 Sonnet Thinking (medium)": "claude-3-7-sonnet",
  "Claude Sonnet 4 Thinking (low)": "claude-sonnet-4",
  "Claude Opus 4 Thinking (low)": "claude-opus-4",
  "Claude Sonnet 4.6 Adaptive Thinking": "claude-sonnet-4-6",
  "Claude Opus 4.7 Adaptive Thinking": "claude-opus-4-7",
  "Nova Lite": "amazon-nova-lite",
  "Nova Micro": "amazon-nova-micro",
  "Nova Pro": "amazon-nova-pro",
  "Jamba Large 1.5": "jamba-1-5-large",
  "Jamba Large 1.6": "jamba-1-6-large",
  "Jamba Large 1.7": "jamba-1-7-large",
  "Jamba Mini 1.5": "jamba-1-5-mini",
  "Jamba Mini 1.6": "jamba-1-6-mini",
  "Jamba Mini 1.7": "jamba-1-7-mini"
};

const board: Leaderboard = {
  benchmark: "fab-send-pedagogy-benchmark",
  url: "https://www.fab-ai.org/benchmarks?benchmark=SEND&cost=10&models=%5B%5D&pageView=table",
  feed,
  aliases: fabAliases,
  terms: "Fab AI marks the leaderboard as all rights reserved. The code repository has an MIT license. robots.txt allows the feed path.",
  stats: { badFormat: { name: 'Bad-format answers', unit: 'count', better: 'lower' } },
  async fetch() {
    return fabCore(board, feed, 'SEND', 275);
  },
};
export default board;
