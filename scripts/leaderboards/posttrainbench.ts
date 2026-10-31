// PostTrainBench: posttrainbench.com is a static GitHub Pages site. Each results version lives in a
// generated JS file (window.SCORES_DATA* = {...JSON...}), and config.js holds the agent names, scaffolds
// and reasoning efforts. The headline is the site's "Average" column: aggregatedScores[agent].avg when the
// file has one (mean over seeds), otherwise the benchmark-weighted average over the four base models,
// exactly as data.js computes it. Baselines (base models, official instruct models) are left out.
//
// Scores from different results versions use different benchmark sets and weights, so each version is its
// own benchmark id: v1 here, v1.1 in posttrainbench-1-1.ts, v1.2 in posttrainbench-1-2.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://posttrainbench.com/';

interface Cell {
  value: number;
}
interface ScoresData {
  resultsVersion?: string;
  benchmarkWeights: Record<string, number>;
  modelBenchmarkData: Record<string, Record<string, Record<string, Cell>>>;
  aggregatedScores?: Record<string, { avg: number }>;
}
interface AgentInfo {
  name?: string;
  scaffold?: string;
  reasoningEffort?: string;
  chartSourceLabel?: string;
  isBaseline?: boolean;
  isExternal?: boolean;
}

/** The JSON object literal after "window.X =" in a generated file. */
function parseScores(js: string): ScoresData {
  return JSON.parse(js.slice(js.indexOf('{'), js.lastIndexOf('}') + 1)) as ScoresData;
}

/** A JS array literal of strings: `const baseModels = ["a", "b"];` */
function parseStringArray(js: string, name: string): string[] {
  const m = js.match(new RegExp(`const ${name}\\s*=\\s*\\[([^\\]]*)\\]`));
  if (!m) throw new Error(`config.js: no ${name}`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

/** config.js's agentInfo object, read field by field (it is JS, not JSON, and is never evaluated). */
function parseAgentInfo(js: string): Record<string, AgentInfo> {
  const start = js.indexOf('const agentInfo');
  if (start < 0) throw new Error('config.js: no agentInfo');
  let i = js.indexOf('{', start) + 1;
  const out: Record<string, AgentInfo> = {};
  while (i < js.length) {
    const head = js.slice(i).match(/^\s*,?\s*"([^"]+)"\s*:\s*\{/);
    if (!head) break;
    const open = i + head[0].length;
    let depth = 1;
    let j = open;
    for (; j < js.length && depth; j++) {
      if (js[j] === '"') j = js.indexOf('"', j + 1);
      else if (js[j] === '{') depth++;
      else if (js[j] === '}') depth--;
    }
    const body = js.slice(open, j - 1);
    const str = (f: string) => body.match(new RegExp(`\\b${f}:\\s*"([^"]*)"`))?.[1];
    const bool = (f: string) => new RegExp(`\\b${f}:\\s*true`).test(body);
    out[head[1]] = {
      name: str('name'),
      scaffold: str('scaffold'),
      reasoningEffort: str('reasoningEffort'),
      chartSourceLabel: str('chartSourceLabel'),
      isBaseline: bool('isBaseline'),
      isExternal: bool('isExternal'),
    };
    i = j;
  }
  return out;
}

const FILES: Record<string, string> = { v1: 'scores-v1.js', 'v1.1': 'scores.js', 'v1.2': 'scores-v1.2.js' };

export function makeBoard(version: 'v1' | 'v1.1' | 'v1.2', benchmark: string): Leaderboard {
  const feed = SITE + FILES[version];
  return {
    benchmark,
    url: version === 'v1.2' ? SITE : `${SITE}?version=${version}`,
    feed,
    terms: 'Generated data file on the PostTrainBench site; the benchmark repository (aisa-group/PostTrainBench) is MIT-licensed.',
    aliases: {
      // config.js: "External result from Intology's Locus system, powered by Opus 5"
      Locus: 'claude-opus-5',
    },
    async fetch() {
      const [scoresJs, configJs] = await Promise.all([fetchText(feed), fetchText(`${SITE}config.js`)]);
      const data = parseScores(scoresJs);
      if (data.resultsVersion && data.resultsVersion !== version) {
        throw new Error(`${FILES[version]} holds ${data.resultsVersion}, expected ${version}`);
      }
      const baseModels = parseStringArray(configJs, 'baseModels');
      const info = parseAgentInfo(configJs);
      const weights = Object.entries(data.benchmarkWeights);
      const rows: LeaderboardRow[] = [];
      for (const [key, perModel] of Object.entries(data.modelBenchmarkData)) {
        const a = info[key];
        if (!a?.name || a.isBaseline) continue; // the site lists only agents named in config.js
        let score = data.aggregatedScores?.[key]?.avg;
        if (score === undefined) {
          let sum = 0;
          for (const m of baseModels) for (const [b, w] of weights) sum += perModel[m][b].value * w;
          score = Number((sum / baseModels.length).toFixed(2));
        }
        // "Opus 4.6 (1M)" is Opus 4.6 with a 1M context window, so the window is a setting
        const ctx = a.name.match(/\s*\((\d+[KM])\)$/);
        const setting = [a.reasoningEffort?.toLowerCase(), ctx ? `${ctx[1]} context` : undefined].filter(Boolean).join(', ');
        rows.push({
          model: ctx ? a.name.slice(0, ctx.index) : a.name,
          score,
          setting: setting || undefined,
          harness: a.isExternal ? `${a.name} (${a.chartSourceLabel ?? 'external'})` : a.scaffold,
        });
      }
      return rows;
    },
  };
}

export default makeBoard('v1', 'posttrainbench');
