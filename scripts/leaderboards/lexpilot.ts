// LexPilot tests legal consultation on incomplete and complete Chinese civil cases.
// Table 2 gives the first task's overall macro F1. Judgment prediction uses quadratic weighted kappa.
// Tables 11, 14, 16 and 17 add five-run variation, class accuracies and judgment scores by cause of action.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2610.23141';
const tracks = ['Legal Completeness Assessment', 'Detail Completion Guidance', 'Interaction-Based LJP', 'Gold-Standard LJP'];
const causes = ['Family', 'Real Rights', 'Torts', 'Service Contract', 'Finance Contract', 'Misc.'];
const parts: Record<string, BoardPart> = { direct: {name: 'Direct LJP', unit: 'score', note: 'Quadratic weighted kappa.'} };
for (const [idx, name] of tracks.entries()) {
  const part = {name, unit: idx < 2 ? '%' as const : 'score' as const};
  parts[name] = part;
  for (const cause of causes) parts[name + ':' + cause] = { ...part, name: cause, group: name };
}
const board: Leaderboard = {
  benchmark: 'lexpilot', static: 'paper', url, feed: url, terms: PAPER_TERMS, parts,
  stats:{completeAccuracy:{name:'Complete case accuracy',unit:'%',better:'higher'},underspecifiedAccuracy:{name:'Underspecified case accuracy',unit:'%',better:'higher'}},
  headline: 'The paper reports separate consultation tasks. The headline is macro F1 for Legal Completeness Assessment, expressed as a percentage.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const [breakdowns, gold, interact] = [tables[1], tables[15], tables[16]];
    const summary = tables[10], accuracies = tables[13];
    if (![breakdowns, gold, interact].every(t => t?.[0].slice(2).join('|') === [...causes, 'Overall'].join('|')) ||
        !summary?.[1].join('|').includes('Macro-F1 )|DCG ( Acc. )|Direct|Interaction-Based|Gold-Standard') ||
        accuracies?.[0].join('|') !== 'Model|Macro-F1|Acc_{C}|Acc_{U}') throw new Error('Missing LexPilot results');
    const split = breakdowns.findIndex(row => row[0].startsWith('Detail Completion Guidance'));
    if (split < 2 || !breakdowns[1][0].startsWith('Legal Completeness Assessment')) throw new Error('Missing LexPilot tracks');
    return checked(summary.slice(2).map(([, model, ...scores]) => {
      const metrics: Record<string, number> = {};
      const groups = [breakdowns.slice(2, split), breakdowns.slice(split + 1), interact.slice(1), gold.slice(1)];
      groups.forEach((group, i) => {
        const row = group.find(r => r[1] === model);
        if (row?.length !== 9) throw new Error('Missing cause scores for ' + model);
        const scale = i < 2 ? 100 : 1;
        metrics[tracks[i]] = numberCell(row[8]) * scale;
        causes.forEach((cause, c) => { metrics[tracks[i] + ':' + cause] = numberCell(row[2 + c]) * scale; });
      });
      const keys = ['std', 'dcgStd', 'directStd', 'interactionStd', 'goldStd'];
      if (scores.length !== keys.length) throw new Error('Missing run statistics');
      scores.forEach((v, i) => {
        const [mean, spread] = v.split('\\pm').map(s => numberCell(s));
        if (!Number.isFinite(spread)) throw new Error('Missing standard deviation');
        metrics[keys[i]] = spread * (i < 2 ? 100 : 1);
        if (i === 2) metrics.direct = mean;
      });
      const acc = accuracies.find(row => row[0] === model);
      if (!acc) throw new Error('Missing consultation accuracies');
      metrics.completeAccuracy = numberCell(acc[2]) * 100;
      metrics.underspecifiedAccuracy = numberCell(acc[3]) * 100;
      return { model, score: metrics[tracks[0]], trials: 5, metrics };
    }), 10);
  },
};
export default board;
