// Game Autoresearch Bench, Kevin Zhang and Max Bittker's benchmark of AI agents that train game-playing networks on a
// GPU budget. The headline is the page's "Overall Ranking" (Figure 1): six training tasks, each standardized against a
// frozen reference scale (50 = the ten reference models' average, 10 points = their standard deviation), averaged
// over the tasks a model ran, with ±1 standard error across its tasks as the interval.
// The page computes Figure 1 in the browser from JSON files in its repository, so this importer repeats TopScore.tsx:
//   - Polytopia empty file, Pokémon 3v3 and forecasting come from top-scores.json, Generals from
//     generals-tournament.json and Hex 13×13 from hex13.json, as reported
//   - the Polytopia recipe task fits each model's log training-compute multiplier over the research-budget cells of
//     budget.json at 1 h and 8 h against the frozen cell offsets, then takes exp of the mean of the two effects; the 8 h
//     multiplier places each recipe's last curve point on the starter's monotone compute curve (CostMultiplier.tsx)
//   - a model needs the four required tasks to be ranked, and Generals and Hex join its average when it ran them
// The frozen constants (cell offsets, task norms, the starter curve's power-law fit) are read from the two source files,
// so a re-norm upstream reaches the next sync. On 2026-11-25 this reproduced all ten overall scores the page showed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://gameautoresearch.github.io/';
const SRC = 'https://raw.githubusercontent.com/gameautoresearch/gameautoresearch.github.io/main/external-website/src/posts/autoresearch/';

interface Task { id: string; scores: Record<string, number> }
interface Recipe { model: string; cell: string; broken: boolean; multiplier1h: number | null; curve: { hours: number; elo: number }[] }
interface Budget { starter: { hours: number; elo: number; n: number }[]; recipes: Recipe[]; fill?: Recipe[] }

// One `const NAME = <literal>;` from a TypeScript source file, read as data (never run). The type annotation before
// the `=` may hold braces of its own, so the literal starts at the first bracket or digit after it.
function literal(source: string, name: string): unknown {
  const at = source.search(new RegExp(`const ${name}\\b[^=]*=\\s*[\\[{0-9.-]`));
  if (at < 0) throw new Error(`Game Autoresearch Bench: ${name} missing from the source`);
  const from = source.slice(at).search(/=\s*[[{0-9.-]/) + at;
  const rest = source.slice(from + 1).trimStart(), i = source.length - rest.length;
  if (rest[0] === '[' || rest[0] === '{') return jsLiteral(source, i);
  return Number(rest.match(/^-?[\d.]+/)![0]);
}

const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

const TASKS = {
  poly_empty: { part: 'polytopiaEmpty', raw: 'polytopiaEmptyGrade', name: 'Polytopia, empty file' },
  poke: { part: 'pokemon', raw: 'pokemonScore', name: 'Pokémon 3v3' },
  forecast: { part: 'forecasting', raw: 'forecastingSkill', name: 'Forecasting training runs' },
  recipe8: { part: 'polytopiaRecipes', raw: 'polytopiaRecipeMultiplier', name: 'Polytopia recipes' },
  generals_t: { part: 'generals', raw: 'generalsElo', name: 'Generals tournament' },
  hex: { part: 'hex', raw: 'hexElo', name: 'Hex 13×13' },
} as const;
type TaskId = keyof typeof TASKS;

const board: Leaderboard = {
  benchmark: 'game-autoresearch-bench',
  url: PAGE,
  feed: `${SRC}top-scores.json`,
  terms: "The page and its data are published in a public GitHub repository under the MIT license. Results are credited to Game Autoresearch Bench.",
  reference: ['Terminus-2'],
  headline: "The page's overall ranking: each of six tasks standardized so 50 is the ten reference models' average and 10 points is their standard deviation, then averaged over the tasks a model ran. The interval is ±1 standard error across its tasks.",
  parts: {
    polytopiaEmpty: { name: 'Polytopia, empty file', group: 'Task', note: 'Train a Polytopia network from an empty training file, graded privately. Standardized score.' },
    polytopiaRecipes: { name: 'Polytopia recipes', group: 'Task', note: "Improve the Polytopia starter recipe on five research budgets, scored by the training compute it saves. Standardized score." },
    pokemon: { name: 'Pokémon 3v3', group: 'Task', note: 'Improve a working Pokémon Showdown starter, scored against the starter. Standardized score.' },
    generals: { name: 'Generals', group: 'Task', note: "The submitted networks' Elo in a 20-network Generals.io tournament. Standardized score." },
    hex: { name: 'Hex 13×13', group: 'Task', note: 'Improve a working AlphaZero-style Hex starter, graded against MoHex and other bots. Standardized score.' },
    forecasting: { name: 'Forecasting', group: 'Task', note: 'Predict how training recipes will do before they run, scored as skill over a blind guess. Standardized score.' },
  },
  stats: {
    polytopiaEmptyGrade: { name: 'Polytopia, empty file grade', unit: 'score', better: 'higher', note: 'Private grade from 0 to 100.' },
    polytopiaRecipeMultiplier: { name: 'Polytopia recipe compute multiplier', unit: 'speedup', better: 'higher', note: "Times the starter's training compute to reach the same strength on a typical budget cell. Research spend isn't counted." },
    pokemonScore: { name: 'Pokémon 3v3 score against the starter', unit: 'score', better: 'higher', note: 'From 0 to 100, where 50 is level with the starter.' },
    generalsElo: { name: 'Generals tournament Elo', unit: 'elo', better: 'higher', note: 'Tournament Elo with the field centered at 1000.' },
    hexElo: { name: 'Hex 13×13 panel Elo', unit: 'elo', better: 'higher', note: 'Elo against a fixed panel, where MoHex at 50,000 simulations per move is 0.' },
    forecastingSkill: { name: 'Forecasting skill', unit: 'score', better: 'higher', note: 'Skill relative to a blind guess.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [topSrc, costSrc, top, budget, generals, hex] = await Promise.all([
      fetchText(`${SRC}TopScore.tsx`), fetchText(`${SRC}CostMultiplier.tsx`),
      fetchText(`${SRC}top-scores.json`), fetchText(`${SRC}budget.json`),
      fetchText(`${SRC}generals-tournament.json`), fetchText(`${SRC}hex13.json`),
    ]);
    const REQUIRED = literal(topSrc, 'RECIPE_TASKS') as TaskId[];
    const OPTIONAL = literal(topSrc, 'OPTIONAL_TASKS') as TaskId[];
    const OFFSETS = literal(topSrc, 'CELL_OFFSETS') as Record<'1h' | '8h', Record<string, number>>;
    const NORMS = literal(topSrc, 'NORMS') as Record<string, { mean: number; sd: number }>;
    const CRASH = literal(topSrc, 'CRASH_MULT') as number;
    const FIT = literal(costSrc, 'FIT') as { einf: number; b: number; alpha: number };
    const ALL = [...REQUIRED, ...OPTIONAL];
    if (ALL.some((id) => !(id in TASKS) || !NORMS[id]) || !OFFSETS['1h'] || !OFFSETS['8h'] || !(CRASH > 0) || !(FIT.alpha > 0))
      throw new Error('Game Autoresearch Bench: the overall score changed shape');

    const scores: Partial<Record<TaskId, Record<string, number>>> = {};
    for (const t of (JSON.parse(top) as { tasks: Task[] }).tasks) if (t.id in TASKS) scores[t.id as TaskId] = t.scores;
    scores.generals_t = Object.fromEntries((JSON.parse(generals) as { rows: { model: string; elo: number }[] }).rows.map((r) => [r.model, r.elo]));
    scores.hex = Object.fromEntries((JSON.parse(hex) as { models: { model: string; elo: number }[] }).models.map((r) => [r.model, r.elo]));

    // The starter's compute curve: weighted pool-adjacent-violators over its measured points, read log-linearly, and
    // past its longest run extended with the shape of the fitted power law.
    const B = JSON.parse(budget) as Budget;
    const blocks: { lt: number; elo: number; w: number }[] = [];
    for (const p of B.starter) {
      blocks.push({ lt: Math.log2(p.hours), elo: p.elo, w: p.n });
      while (blocks.length > 1 && blocks[blocks.length - 2].elo >= blocks[blocks.length - 1].elo) {
        const b = blocks.pop()!, a = blocks.pop()!, w = a.w + b.w;
        blocks.push({ lt: (a.lt * a.w + b.lt * b.w) / w, elo: (a.elo * a.w + b.elo * b.w) / w, w });
      }
    }
    const K = blocks.map((b) => ({ hours: 2 ** b.lt, elo: b.elo })), TOP = K[K.length - 1];
    const fitHours = (elo: number) => (FIT.b / Math.max(FIT.einf - elo, 1e-9)) ** (1 / FIT.alpha);
    const starterHours = (elo: number) => {
      if (elo >= TOP.elo) return TOP.hours * (fitHours(elo) / fitHours(TOP.elo));
      if (elo <= K[0].elo) { const s = (K[1].elo - K[0].elo) / Math.log2(K[1].hours / K[0].hours); return K[0].hours * 2 ** ((elo - K[0].elo) / s); }
      for (let i = 1; i < K.length; i++) if (elo <= K[i].elo) return K[i - 1].hours * (K[i].hours / K[i - 1].hours) ** ((elo - K[i - 1].elo) / (K[i].elo - K[i - 1].elo));
      return TOP.hours;
    };
    const obs: Record<'1h' | '8h', { model: string; cell: string; y: number }[]> = { '1h': [], '8h': [] };
    for (const r of [...B.recipes, ...(B.fill ?? [])]) {
      if (r.cell === 'zero-shot') continue;
      const model = r.model === 'Opus 5.5' ? 'Claude Opus 5.5' : r.model;
      const end = r.curve[r.curve.length - 1];
      obs['1h'].push({ model, cell: r.cell, y: Math.log(r.broken || r.multiplier1h === null ? CRASH : r.multiplier1h) });
      obs['8h'].push({ model, cell: r.cell, y: Math.log(r.broken || !end ? CRASH : starterHours(end.elo) / end.hours) });
    }
    const effect = (k: '1h' | '8h', model: string) => {
      const mine = obs[k].filter((o) => o.model === model && OFFSETS[k][o.cell] !== undefined);
      return mine.length ? mean(mine.map((o) => o.y - OFFSETS[k][o.cell])) : undefined;
    };
    scores.recipe8 = {};
    for (const m of new Set(obs['8h'].map((o) => o.model))) {
      const e1 = effect('1h', m), e8 = effect('8h', m);
      if (e1 !== undefined && e8 !== undefined) scores.recipe8[m] = Math.exp((e1 + e8) / 2);
    }

    const standardize = (id: TaskId, v: number) => 50 + (10 * ((id === 'recipe8' ? Math.log(v) : v) - NORMS[id].mean)) / NORMS[id].sd;
    const ranked = Object.keys(scores.poly_empty ?? {}).filter((m) => REQUIRED.every((id) => scores[id]?.[m] !== undefined));
    if (ranked.length < 5) throw new Error(`Game Autoresearch Bench: only ${ranked.length} models have every required task`);
    return ranked.map((model) => {
      const metrics: Record<string, number> = {};
      const each: number[] = [];
      for (const id of ALL) {
        const v = scores[id]?.[model];
        if (v === undefined) continue;
        const z = standardize(id, v);
        each.push(z);
        metrics[TASKS[id].part] = r2(z);
        metrics[TASKS[id].raw] = r4(v);
      }
      const n = each.length, score = mean(each);
      const se = Math.sqrt(each.reduce((a, b) => a + (b - score) ** 2, 0) / (n - 1) / n);
      if (!Number.isFinite(score) || !Number.isFinite(se)) throw new Error(`Game Autoresearch Bench: bad result for ${model}`);
      return { model, harness: 'Terminus-2', score: r2(score), low: r2(score - se), high: r2(score + se), metrics };
    });
  },
};
export default board;
