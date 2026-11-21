// HANS tests whether natural language inference systems rely on syntactic shortcuts.
// The authors publish four prediction files and the gold labels for all 30,000 examples.
// Their evaluator maps neutral and contradiction to non-entailment before checking each answer.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const root = 'https://raw.githubusercontent.com/tommccoy1/hans/HEAD/';
const feed = root + 'heuristics_evaluation_set.txt';
const predictions = {
  BERT: 'bert_preds.txt', 'Decomposable Attention': 'decomp_attn_heur_preds.txt', ESIM: 'esim_heur_preds.txt', SPINN: 'spinn_preds_heur.txt',
};
const board: Leaderboard = {
  benchmark: 'hans', url: 'https://github.com/tommccoy1/hans#evaluation', feed,
  terms: 'MIT License at https://github.com/tommccoy1/hans/blob/master/LICENSE.md.',
  async fetch() {
    const [header, ...examples] = (await fetchText(feed)).trimEnd().split(/\r?\n/);
    const columns = ['pairID', 'gold_label', 'heuristic', 'subcase', 'template'].map(k => header.split('\t').indexOf(k));
    if (columns.includes(-1) || examples.length !== 30000) throw new Error('Missing HANS examples or labels');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const gold = new Map(examples.map(line => {
      const cells = line.split('\t');
      const [id, label, heuristic, subcase, template] = columns.map(i => cells[i]);
      const group = heuristic + '_' + label.replace('-', '_');
      parts[group] = { name: heuristic.replaceAll('_', ' ') + ', ' + label, group: 'Heuristic and label' };
      parts[subcase] = { name: subcase.replaceAll('_', ' '), group: 'Subcase' };
      parts[template] = { name: template.replaceAll('_', ' '), group: 'Template' };
      return [id, { label, groups: [group, subcase, template] }] as const;
    }));
    if (gold.size !== examples.length) throw new Error('Duplicate HANS example');
    board.parts = parts;
    const result: LeaderboardRow[] = [];
    for (const [model, file] of Object.entries(predictions)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const [head, ...lines] = (await fetchText(root + file)).trimEnd().split(/\r?\n/);
      if (head !== 'pairID,gold_label') throw new Error('Missing prediction columns');
      const seen = new Set<string>();
      const counts = new Map<string, { right: number; n: number }>();
      let correct = 0;
      for (const line of lines) {
        const [id, pred] = line.split(',');
        const example = gold.get(id);
        if (!example || seen.has(id) || !['entailment', 'neutral', 'contradiction', 'non-entailment'].includes(pred)) throw new Error('Invalid HANS prediction');
        seen.add(id);
        const right = Number(example.label === (pred === 'entailment' ? pred : 'non-entailment'));
        correct += right;
        for (const key of example.groups) {
          const count = counts.get(key) ?? { right: 0, n: 0 };
          count.right += right;
          count.n++;
          counts.set(key, count);
        }
      }
      if (seen.size !== gold.size) throw new Error('Incomplete HANS predictions');
      result.push({ model, score: 100 * correct / seen.size, link: root + file,
        metrics: Object.fromEntries([...counts].map(([k, c]) => [k, 100 * c.right / c.n])) });
    }
    return checked(result, 4);
  },
};
export default board;
