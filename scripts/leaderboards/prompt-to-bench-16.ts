// Prompt-to-Bench ranks desktop NPU models by tasks passed within three tries. Tables 12 and 13 give the standard and extended thinking results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/ATinyGreenCell/prompt-to-bench/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "prompt-to-bench-16",
  url: "https://github.com/ATinyGreenCell/prompt-to-bench#65-larger-open-models-on-an-npu-box",
  feed,
  terms: "The author licenses the paper under CC BY 4.0. Separate model licenses apply to third-party outputs. https://github.com/ATinyGreenCell/prompt-to-bench/blob/main/LICENSE The feed host returns no robots.txt.",
  async fetch() {
    const source = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
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
        rows.push({ model: cell('Model'), score, setting: thinking ? 'Thinking on, 16,384 tokens' : 'Thinking off, 2,048 tokens', trials: samples.length, metrics });
      }
    }
    return rows;
  },
};
export default board;
