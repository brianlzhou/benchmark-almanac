// OpenResearch Intelligence Index (alphaXiv): composite autoresearch benchmark evaluating frontier models in their
// native coding harnesses (Claude Code, Codex, OpenCode) inside OpenResearch across Science (20 Terminal-Bench-Science
// tasks, weight 0.4), Post-training (6 fine-tuning tasks, weight 0.4), and Literature relevancy (45 PaperFindingBench
// queries, weight 0.2). The importer follows the blog post to its Vite-bundled ResultsTable and CostScoreChart chunks.
// Headline spread definitions quoted verbatim from the source:
// - ResultsTable caption: "Score is the headline metric ± one standard error." -> stored as metrics.stderr (in %).
// - CostScoreChart tooltip: "95% CI" -> stored on row.low and row.high (in %).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.alphaxiv.org/blog/introducing-openresearch-intelligence-index';
const BASE = 'https://www.alphaxiv.org';

interface TableRow {
  model: string;
  harness: string;
  score: { mean: number; se: number };
  cost: { mean: number; se: number };
  inputTokens: { mean: number; se: number };
  outputTokens: { mean: number; se: number };
  minutes: { mean: number; se: number };
}

interface ChartRow {
  name: string;
  index: { score: number; lo: number; hi: number; usd: number };
  science: { score: number; usd: number };
  postTraining: { score: number; usd: number };
  literature: { score: number; usd: number };
}

/** Parse a JS array literal of flat/nested objects with backtick strings and leading-dot numbers without eval. */
function extractArrayJson(js: string, startIndex: number): string {
  let depth = 0;
  let inStr: string | null = null;
  let esc = false;
  let end = -1;
  for (let i = startIndex; i < js.length; i++) {
    const ch = js[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('Unterminated JS array literal');
  return js.slice(startIndex, end);
}

/** Pull a numeric property value like `mean:.6183` or `usd:1432.4` from an object snippet. */
function numProp(block: string, key: string): number {
  const m = block.match(new RegExp(`(?:^|[{,])${key}:(-?\\d*\\.\\d+|-?\\d+)`));
  if (!m) throw new Error(`Missing numeric field ${key}`);
  const v = Number(m[1]);
  if (!Number.isFinite(v)) throw new Error(`Invalid numeric field ${key}: ${m[1]}`);
  return v;
}

/** Pull a string property like `model:\`Opus 5.5\`` from an object snippet. */
function strProp(block: string, key: string): string {
  const m = block.match(new RegExp(`(?:^|[{,])${key}:[\`"']([^'"\`]+)[\`"']`));
  if (!m) throw new Error(`Missing string field ${key}`);
  return m[1].trim();
}

/** Pull a nested `{...}` block by property key. */
function subBlock(block: string, key: string): string {
  const m = block.match(new RegExp(`(?:^|[{,])${key}:(\\{[^}]*\\})`));
  if (!m) throw new Error(`Missing object field ${key}`);
  return m[1];
}

/** Split top-level `{...}` elements of a JS array literal. */
function splitObjects(arrText: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr: string | null = null;
  let esc = false;
  for (let i = 0; i < arrText.length; i++) {
    const ch = arrText[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(arrText.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}

function parseTable(js: string): TableRow[] {
  const anchor = js.indexOf('[{model:`');
  if (anchor < 0) throw new Error('OpenResearch ResultsTable array not found');
  return splitObjects(extractArrayJson(js, anchor)).map((obj) => ({
    model: strProp(obj, 'model'),
    harness: strProp(obj, 'harness'),
    score: { mean: numProp(subBlock(obj, 'score'), 'mean'), se: numProp(subBlock(obj, 'score'), 'se') },
    cost: { mean: numProp(subBlock(obj, 'cost'), 'mean'), se: numProp(subBlock(obj, 'cost'), 'se') },
    inputTokens: { mean: numProp(subBlock(obj, 'inputTokens'), 'mean'), se: numProp(subBlock(obj, 'inputTokens'), 'se') },
    outputTokens: { mean: numProp(subBlock(obj, 'outputTokens'), 'mean'), se: numProp(subBlock(obj, 'outputTokens'), 'se') },
    minutes: { mean: numProp(subBlock(obj, 'minutes'), 'mean'), se: numProp(subBlock(obj, 'minutes'), 'se') },
  }));
}

function parseChart(js: string): Map<string, ChartRow> {
  const anchor = js.indexOf('[{name:`');
  if (anchor < 0) throw new Error('OpenResearch CostScoreChart array not found');
  const map = new Map<string, ChartRow>();
  for (const obj of splitObjects(extractArrayJson(js, anchor))) {
    const name = strProp(obj, 'name');
    const idx = subBlock(obj, 'index');
    const sci = subBlock(obj, 'science');
    const pt = subBlock(obj, 'postTraining');
    const lit = subBlock(obj, 'literature');
    map.set(name, {
      name,
      index: { score: numProp(idx, 'score'), lo: numProp(idx, 'lo'), hi: numProp(idx, 'hi'), usd: numProp(idx, 'usd') },
      science: { score: numProp(sci, 'score'), usd: numProp(sci, 'usd') },
      postTraining: { score: numProp(pt, 'score'), usd: numProp(pt, 'usd') },
      literature: { score: numProp(lit, 'score'), usd: numProp(lit, 'usd') },
    });
  }
  return map;
}

const board: Leaderboard = {
  benchmark: 'openresearch-intelligence-index',
  url: `${PAGE}#results`,
  feed: `${PAGE} (ResultsTable and CostScoreChart bundles)`,
  terms: 'Published openly on the alphaXiv blog. Robots.txt at alphaxiv.org permits crawling of blog pages and assets.',
  harnesses: 'system',
  parts: {
    science: { name: 'Science', group: 'Track', note: 'Weighted 40% in the composite index across 20 Terminal-Bench-Science tasks.' },
    postTraining: { name: 'Post-training', group: 'Track', note: 'Weighted 40% in the composite index across six fine-tuning tasks.' },
    literature: { name: 'Literature relevancy', group: 'Track', note: 'Weighted 20% in the composite index across 45 PaperFindingBench queries.' },
  },
  stats: {
    fullRunCost: { name: 'Full run cost', unit: 'usd', better: 'lower', note: 'Estimated API token cost for one full benchmark pass across all three tracks.' },
    inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower', note: 'Mean input tokens per task attempt.' },
    minutes: { name: 'Wall-clock time', unit: 'minutes', better: 'lower', note: 'Mean wall-clock minutes per task attempt.' },
  },
  chart: {
    title: 'Score vs. API cost',
    note: 'OpenResearch Intelligence Index against API token cost for one full benchmark pass, matching the Pareto chart in the launch post.',
    x: { key: 'fullRunCost', label: 'Cost of one full benchmark pass', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'OpenResearch Intelligence Index', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const bpMatch = html.match(/\/assets\/BlogPost-[A-Za-z0-9_-]+\.js/);
    if (!bpMatch) throw new Error('BlogPost chunk link not found on alphaXiv page');
    const bpJs = await fetchText(`${BASE}${bpMatch[0]}`);
    const slug = 'introducing-openresearch-intelligence-index/components/';
    const rtMatch = bpJs.match(new RegExp(`${slug}ResultsTable\\.tsx":\\(\\)=>g\\(\\(\\)=>import\\(\`\\./([^\\\`]+)\`\\)`));
    const ccMatch = bpJs.match(new RegExp(`${slug}CostScoreChart\\.tsx":\\(\\)=>g\\(\\(\\)=>import\\(\`\\./([^\\\`]+)\`\\)`));
    if (!rtMatch || !ccMatch) throw new Error('OpenResearch blog component chunks not found');
    const [rtJs, ccJs] = await Promise.all([
      fetchText(`${BASE}/assets/${rtMatch[1]}`),
      fetchText(`${BASE}/assets/${ccMatch[1]}`),
    ]);
    const tableRows = parseTable(rtJs);
    const chartMap = parseChart(ccJs);
    const out: LeaderboardRow[] = tableRows.map((r) => {
      const c = chartMap.get(r.model);
      if (!c) throw new Error(`Missing chart entry for ${r.model}`);
      return {
        model: r.model,
        harness: r.harness,
        score: Number((r.score.mean * 100).toFixed(2)),
        low: Number((c.index.lo * 100).toFixed(2)),
        high: Number((c.index.hi * 100).toFixed(2)),
        cost: r.cost.mean,
        tokens: Math.round(r.outputTokens.mean),
        metrics: {
          stderr: Number((r.score.se * 100).toFixed(2)),
          science: Number((c.science.score * 100).toFixed(2)),
          postTraining: Number((c.postTraining.score * 100).toFixed(2)),
          literature: Number((c.literature.score * 100).toFixed(2)),
          fullRunCost: c.index.usd,
          inputTokens: Math.round(r.inputTokens.mean),
          minutes: r.minutes.mean,
        },
      };
    });
    if (out.length < 5) throw new Error(`OpenResearch returned only ${out.length} rows`);
    return out;
  },
};
export default board;
