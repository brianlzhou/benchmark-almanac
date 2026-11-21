// Penn epilepsy clinic notes tests seizure information extraction from specialist notes.
// The accompanying repository lists five held-out runs for ClinicalBERT, RoBERTa, and BERT.
// This importer reads the hard-coded result arrays in plot_results.py and averages each model's five runs.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/penn-cnt/Extracting-Clinical-Information-From-Epilepsy-Clinic-Notes/main/plot_results.py';
const board: Leaderboard = {
  benchmark: 'penn-epilepsy-clinic-notes',
  url: 'https://github.com/penn-cnt/Extracting-Clinical-Information-From-Epilepsy-Clinic-Notes',
  feed: FEED,
  terms: 'The repository is public under its own license and terms. https://github.com/penn-cnt/Extracting-Clinical-Information-From-Epilepsy-Clinic-Notes',
  parts: {
    classificationAccuracy: {name: 'Classification accuracy'},
    seizureFrequencyF1: {name: 'Seizure frequency F1'},
    recentSeizureF1: {name: 'Most recent seizure F1'},
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await fetchText(FEED);
    const blocks: Record<string, number[][]> = {};
    for (const name of ['clinicalBERT_performance', 'RoBERTa_performance', 'BERT_base_performance']) {
      const match = text.match(new RegExp(`${name} = np\\.array\\(\\[(.*?)\\]\\s*\\)`, 's'));
      if (!match) throw new Error(`Missing ${name}`);
      blocks[name] = [...match[1].matchAll(/\[([^\]]+)\]/g)].map(m => m[1].split(',').map(Number));
      if (blocks[name].length !== 5) throw new Error(`Expected five ${name} rows`);
    }
    return Object.entries(blocks).map(([name, rows]) => {
      const mean = (column: number) => rows.reduce((sum, row) => sum + row[column], 0) / rows.length;
      return {
        model: name === 'clinicalBERT_performance' ? 'ClinicalBERT' : name === 'RoBERTa_performance' ? 'RoBERTa' : 'BERT base',
        score: mean(3),
        metrics: {classificationAccuracy: mean(0) * 100, seizureFrequencyF1: mean(1), recentSeizureF1: mean(5)},
      };
    });
  },
};
export default board;
