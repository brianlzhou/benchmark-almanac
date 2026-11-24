// Prompt-to-Bench ranks desktop NPU models by tasks passed within three tries. Tables 12 and 13 give the standard and extended thinking results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/ATinyGreenCell/prompt-to-bench/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "prompt-to-bench-16",
  stats: {
    minutesPerTask: { name: 'Minutes per task', unit: 'minutes', better: 'lower' },
    'Mean best score': { name: 'Mean best score across attempts', unit: 'score', better: 'higher', note: 'Score from 0 to 1.' },
    'Tokens/s': { name: 'Tokens per second', unit: 'tokens/s', better: 'higher' },
    'Median reasoning per reply (characters)': { name: 'Median reasoning per reply', unit: 'count', better: 'lower', note: 'Median number of reasoning characters in one reply.' },
    paramsB: { name: 'Total parameters', unit: 'billions', better: 'lower' },
    downloadGb: { name: 'Model download size', unit: 'gb', better: 'lower' },
    tasksPassedAnySample: { name: 'Tasks passed in any sample', unit: 'count', better: 'higher', note: 'Distinct tasks out of 16 passed in at least one sample.' },
    passFirstTryRate: { name: 'Passed on first try', unit: '%', better: 'higher' },
    renderFirstTryRate: { name: 'Renders on first try', unit: '%', better: 'higher' },
    cutoffRate: { name: 'Cutoff rate', unit: '%', better: 'lower', note: 'Share of attempts or replies cut off at the token limit.' },
  },
  chart: {
    title: 'Tasks passed vs. model size',
    x: { key: 'paramsB', label: 'Total parameters', unit: 'B', better: 'lower', log: true },
    y: { key: 'score', label: 'Tasks passed', unit: 'tasks', better: 'higher' },
    note: 'Mean tasks passed within three tries against total parameter count on a log scale, matching Figure 7 on Prompt-to-Bench.',
  },
  url: "https://github.com/ATinyGreenCell/prompt-to-bench#65-larger-open-models-on-an-npu-box",
  feed,
  terms: "The author licenses the paper under CC BY 4.0. Separate model licenses apply to third-party outputs. https://github.com/ATinyGreenCell/prompt-to-bench/blob/main/LICENSE The feed host returns no robots.txt.",
  async fetch() {
    const source = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    const paramsByModel = new Map<string, number>();
    const frac = (s: string | undefined) => {
      const m = s?.match(/^(\d+)\s*\/\s*(\d+)$/);
      return m && Number(m[2]) > 0 ? { n: Number(m[1]), pct: (100 * Number(m[1])) / Number(m[2]) } : undefined;
    };
    for (const thinking of [false, true]) {
      const id = thinking ? 'table-tiiny-think' : 'table-tiiny';
      const section = source.split('<!-- AUTO:' + id + ' -->')[1]?.split('<!-- /AUTO:')[0];
      const table = markdownTables(section ?? '')[0];
      const samplesKey = thinking ? 'Thinking on, 16,384 tokens: passed per sample' : 'Passed ≤3 tries, per sample';
      if (!table || table.length <= (thinking ? 10 : 16) || !table[0].includes(samplesKey)) throw new Error('Incomplete NPU table');
      for (const cells of table.slice(1)) {
        const cell = (name: string) => cells[table[0].indexOf(name)];
        const samples = cell(samplesKey).split('·').map(v => Number.parseInt(v));
        const score = thinking ? samples.reduce((a, b) => a + b, 0) / samples.length : Number(cell('Mean'));
        if (!Number.isFinite(score) || !samples.every(Number.isFinite)) throw new Error('Invalid task count');
        const metrics: Record<string, number> = { minutesPerTask: Number(cell('Median min/task')) };
        for (const key of ['Mean best score', 'Tokens/s', 'Median reasoning per reply (characters)']) {
          if (cell(key)) metrics[key] = Number(cell(key).replaceAll(',', ''));
        }
        const dl = cell('Download')?.match(/([\d.]+)\s*GB/i);
        if (dl) metrics.downloadGb = Number(dl[1]);
        const anySample = frac(cell('Tasks passed in any sample'));
        if (anySample) metrics.tasksPassedAnySample = anySample.n;
        const pass1 = frac(cell('Passed 1st try'));
        if (pass1) metrics.passFirstTryRate = Math.round(pass1.pct * 10) / 10;
        const rend1 = frac(cell('Renders 1st try'));
        if (rend1) metrics.renderFirstTryRate = Math.round(rend1.pct * 10) / 10;
        const cut = frac(cell(thinking ? 'Replies cut off' : 'Attempts cut off'));
        if (cut) metrics.cutoffRate = Math.round(cut.pct * 10) / 10;
        const model = cell('Model');
        const parameterText = cell('Parameters');
        const parameterMatch = parameterText?.match(/[\d.]+/);
        const params = parameterMatch ? Number(parameterMatch[0]) : paramsByModel.get(model);
        if (params !== undefined && Number.isFinite(params)) {
          paramsByModel.set(model, params);
          metrics.paramsB = params;
        }
        rows.push({ model, score, ...(params !== undefined && Number.isFinite(params) ? { params } : {}), setting: thinking ? 'Thinking on, 16,384 tokens' : 'Thinking off, 2,048 tokens', trials: samples.length, metrics });
      }
    }
    return rows;
  },
};
export default board;
