// DDXPlus tests diagnosis of simulated patients. Table 3 gives top-one pathology accuracy
// for two agents trained with and without differential diagnosis, averaged over three runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://proceedings.neurips.cc/paper_files/paper/2022/file/cae73a974390c0edd95ae7aeae09139c-Paper-Datasets_and_Benchmarks.pdf';
const board: Leaderboard = {
  benchmark: 'ddxplus', static: 'paper', url: feed, feed,
  terms: 'NeurIPS publishes the authors’ paper under its proceedings terms. https://proceedings.neurips.cc/',
  stats:{
    interactionLength:{name:'Interaction length',unit:'count'},
    gtpaAt1:{name:'Ground truth pathology accuracy at one',unit:'%',better:'higher'},
    gtpa:{name:'Ground truth pathology accuracy',unit:'%',better:'higher'},
    per:{name:'Patient evidence recall',unit:'%',better:'higher'},
    ddr:{name:'Differential diagnosis recall',unit:'%',better:'higher'},
    ddp:{name:'Differential diagnosis precision',unit:'%',better:'higher'},
    ddf1:{name:'Differential diagnosis F1',unit:'%',better:'higher'},
  },
  async fetch() {
    const paper = await pdfText(feed);
    const match = paper.match(/Method\s+Diff\s+IL\s+GTPA@1\s+GTPA\s+PER\s+DDR\s+DDP\s+DDF1([\s\S]*?)5\s+Conclusion/);
    if (!match) throw Error('Missing Table 3 columns');
    const lines = match[1].trim().split('\n').map(s => s.trim()).filter(Boolean);
    const rows: LeaderboardRow[] = [];
    for (const offset of [0, 3]) {
      const model = lines[offset + 1];
      if (!['AARLC', 'BASD'].includes(model)) throw Error('Unexpected Table 3 label');
      for (const line of [lines[offset], lines[offset + 2]]) {
        const pairs = Array.from(line.matchAll(/(\d+\.\d+) \((\d+\.\d+)\)/g), m => [Number(m[1]), Number(m[2])]);
        if (!/^[X×]\s/.test(line) || pairs.length !== 7) throw Error('Unexpected Table 3 row');
        const metrics: Record<string, number> = {};
        ['interactionLength','gtpaAt1','gtpa','per','ddr','ddp','ddf1'].forEach((key,i) => {
          [metrics[key], metrics[key + 'Ci95']] = pairs[i];
        });
        const [score, halfWidth] = pairs[1];
        rows.push({ model, score, low: score - halfWidth, high: score + halfWidth, trials: 3, metrics,
          setting: line.startsWith('X') ? 'Differential diagnosis training' : 'Ground truth pathology training' });
      }
    }
    return checked(rows, 4);
  },
};
export default board;
