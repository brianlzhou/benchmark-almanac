// MasakhaNER 2.0 measures named-entity F1 in 20 African languages.
// Tables 4 and 5 give published averages for monolingual and pooled training. Table 6 compares
// mDeBERTaV3 source-language choices, including English and the sources predicted by LangRank.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2210.12391';
const board: Leaderboard = {
  benchmark: 'masakhaner-2', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const baseline = tables.find(t => t[0][0] === 'Model' && t[0][1] === 'bam' && t[0][21] === 'AVG');
    const pooled = tables.find(t => t[0][0] === 'Train Lang.' && t[0][22] === 'AVG');
    const transfer = tables.find(t => t[0][3] === 'Top-3 features selected' && t[0][10] === 'eng');
    const names = tables.find(t => t[1]?.[0] === 'Language' && t[1][1] === 'Family');
    if (!baseline || !pooled || !transfer || !names) throw new Error('Missing MasakhaNER results');
    const languages = baseline[0].slice(1, -1);
    const parts: Record<string, string> = {};
    for (const [label] of names.slice(2)) {
      const pair = label.match(/^(.+) \( ([a-z]{3}) \)$/);
      if (pair) parts[pair[2]] = pair[1];
    }
    if (!languages.every(lang => parts[lang])) throw new Error('Missing language names');
    board.parts = parts;
    const rows: LeaderboardRow[] = [];
    function add(model: string, setting: string, values: string[]) {
      const stats = values.at(-1)?.replace(/\\mathbf|[{}_]/g, '').split('\\pm');
      if (values.length !== 21 || stats?.length !== 2) throw new Error('Missing five-run average');
      const metrics = Object.fromEntries(languages.map((lang,i) => [lang, numberCell(values[i])]));
      rows.push({model, setting, trials: 5, score: numberCell(stats[0]), metrics: {...metrics, spread: numberCell(stats[1])}});
    }
    for (const [model, ...values] of baseline.slice(1)) {
      if (!model.startsWith('PLM pre-trained')) add(model, 'Target-language fine-tuning', values);
    }
    const start = pooled.findIndex(r => r[0] === 'Evaluation on MasakhaNER 2.0 test set');
    const end = pooled.findIndex(r => r[0] === 'Evaluation on MasakhaNER 1.0 test set');
    if (start < 0 || end <= start) throw new Error('Missing 2.0 test-set grouping');
    for (const [train, data, ...values] of pooled.slice(start + 1, end)) {
      add('AfroXLMR-large', train.replace(/^\([abc]\) /, '') + ' languages, ' + data + ' training data', values);
    }
    const average = transfer.at(-1)!;
    if (average[0] !== 'AVG') throw new Error('Missing transfer averages');
    for (const [col, setting] of [[5, 'Top-1 LangRank source'], [6, 'Top-2 LangRank sources'], [10, 'English source']] as const) {
      const metrics = Object.fromEntries(transfer.slice(3,-1).map(r => [r[0], numberCell(r[col])]));
      if (!languages.every(lang => Number.isFinite(metrics[lang]))) throw new Error('Missing target language');
      rows.push({model:'mDeBERTaV3', setting, score:numberCell(average[col]), metrics});
    }
    return checked(rows, 14);
  },
};
export default board;
