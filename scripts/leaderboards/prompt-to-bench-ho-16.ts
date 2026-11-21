// Prompt-to-Bench measures how many of 16 held-out designs pass.
// Table 15 reports mean tasks passed across samples and groups two tied laptop models.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/ATinyGreenCell/prompt-to-bench/main/README.md";

const board: Leaderboard = {
  benchmark: "prompt-to-bench-ho-16",
  stats: { shareKept: { name: 'Share kept', unit: 'score', better: 'higher', note: 'Fraction of generated results retained, from 0 to 1.' } },
  url: "https://github.com/ATinyGreenCell/prompt-to-bench#67-new-tasks",
  feed,
  terms: "The author licenses the paper under CC BY 4.0. Separate model licenses apply to third-party outputs. The host has no robots.txt.",
  async fetch() {
    const source = await fetchText(feed);
    const allTables = markdownTables(source);
    const table = allTables.find(t => t[0].join('|') === 'Model (machine)|Original 16: tasks passed per sample|HO-16|Share kept');
    const modelTable = allTables.find(t => t[0].join('|') === 'Model|Family|Parameters|Download|Runs on|Licence');
    if (!table || table.length < 9) throw new Error('Missing HO-16 results');
    const parameters = new Map<string, number>();
    for (const cells of modelTable?.slice(2) ?? []) {
      const model = cells[0].replaceAll('`', '');
      const value = Number(cells[2].match(/[\d.]+/)?.[0]);
      if (Number.isFinite(value)) parameters.set(model, value);
    }
    const parameterFor = (model: string) => {
      const clean = model.replace(/ \((?:box|ceiling|laptop)\)$/, '').replace(/, laptop\)$/, ')');
      const exact = parameters.get(clean);
      if (exact !== undefined) return exact;
      const match = [...parameters.entries()].find(([name]) => name.startsWith(clean) || clean.startsWith(name));
      return match?.[1];
    };
    return table.slice(1).flatMap(([label, , result, retained]) => {
      const score = Number(result.match(/\(([\d.]+)\)$/)?.[1] ?? result.match(/^\d+/)?.[0]);
      if (!Number.isFinite(score)) throw new Error('Invalid HO-16 result: ' + result);
      const setting = label.match(/\((.+)\)$/)?.[1];
      const names = label.replace(/ \(.+\)$/, '').split(', ');
      return names.map(model => ({ model, score, setting, trials: result.split(' (')[0].split(/, (?=\d)/).length,
        ...(parameterFor(model) !== undefined ? { params: parameterFor(model) } : {}),
        ...(retained !== '-' ? { metrics: { shareKept: Number(retained) } } : {}) }));
    });
  },
};
export default board;
