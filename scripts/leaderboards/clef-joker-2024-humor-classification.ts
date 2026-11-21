// The 2024 JOKER humor classification task ranks submitted runs by overall test accuracy.
// Tables 3 and 4 give overall results and per-class precision, recall and F1 in the organizers’ report.
import type { BoardStat, Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://ceur-ws.org/Vol-3740/paper-166.pdf";
const classParts = Object.fromEntries(['SD','WS','EX','IR','SC','AID'].map(k => [k, k + ' F1']));

const board: Leaderboard = {
  benchmark: "clef-joker-2024-humor-classification", static: 'paper',
  url: "https://ceur-ws.org/Vol-3740/paper-166.pdf#page=6",
  feed,
  terms: "The authors publish this results table under CC BY 4.0. https://ceur-ws.org/Vol-3740/paper-166.pdf#page=1 CEUR-WS robots.txt permits this volume.",
  parts: classParts,
  stats: Object.fromEntries([...['macroPrecision','macroRecall','macroF1','weightedPrecision','weightedRecall','weightedF1', 'SDPrecision','SDRecall','WSPrecision','WSRecall','EXPrecision','EXRecall','IRPrecision','IRRecall','SCPrecision','SCRecall','AIDPrecision','AIDRecall'].map(key => [key, { name: key.replace(/^(SD|WS|EX|IR|SC|AID)(Precision|Recall)$/, '$1 class $2').replace(/([a-z])([A-Z])/g, '$1 $2'), unit: '%', better: 'higher' as const }]), ['instancesAttempted', { name: 'Instances attempted', unit: 'count' }]] as [string, BoardStat][]),
  async fetch() {
    const text = await pdfText(feed);
    function readTable(n: number, width: number) {
      const section = text.split('\fTable ' + n + '\n')[1]?.split('\f')[0];
      if (!section) throw new Error('Missing JOKER table ' + n);
      return section.split('\n').flatMap(line => {
        const match = line.trim().match(/^(.+?)\s+(\d+(?:\s+\d+)+)$/);
        if (!match) return [];
        const numbers = match[2].split(/\s+/).map(Number);
        if (numbers.length !== width) throw new Error('Invalid JOKER columns for ' + match[1]);
        return [{ name: match[1], numbers }];
      });
    }
    const overall = readTable(3, 8), classes = readTable(4, 18);
    if (overall.length < 53 || overall.length !== classes.length) throw new Error('Missing JOKER submissions');
    const labels = ['SD', 'WS', 'EX', 'IR', 'SC', 'AID'];
    board.parts = Object.fromEntries(labels.map(k => [k, k + ' F1']));
    return overall.map(({ name, numbers }, i) => {
      if (name !== classes[i].name) throw new Error('JOKER table order changed');
      const metrics: Record<string, number> = Object.fromEntries(['macroPrecision','macroRecall','macroF1','weightedPrecision',
        'weightedRecall','weightedF1','instancesAttempted'].map((k,j) => [k, numbers[j+1]]));
      for (const [j,k] of labels.entries()) {
        metrics[k + 'Precision'] = classes[i].numbers[3*j];
        metrics[k + 'Recall'] = classes[i].numbers[3*j+1];
        metrics[k] = classes[i].numbers[3*j+2];
      }
      return { model: name, submitter: name.split('_')[0], score: numbers[0], metrics };
    });
  },
};

export default board;
