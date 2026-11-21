// TREK-150 evaluates object tracking from first-person video. CodaLab sorts its standings by multi-start Success Score and publishes all three evaluation protocols in the HTML table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://codalab.lisn.upsaclay.fr/competitions/9597/results/15579";
const board: Leaderboard = {
  benchmark: "trek-150",
  url: "https://codalab.lisn.upsaclay.fr/competitions/9597#results",
  feed: FEED,
  terms: "The terms require written permission to redistribute EPIC-KITCHENS-100 data. They give no separate score license. https://codalab.lisn.upsaclay.fr/competitions/9597#learn_the_details-terms_and_conditions The host has no published robots directives at /robots.txt.",
  parts: {
  "mse_ss": {
    "name": "Success Score",
    "group": "Multi-Start Evaluation",
    "unit": "score"
  },
  "mse_nps": {
    "name": "Normalized Precision Score",
    "group": "Multi-Start Evaluation",
    "unit": "score"
  },
  "mse_gsr": {
    "name": "Generalized Success Robustness Score",
    "group": "Multi-Start Evaluation",
    "unit": "score"
  },
  "ope_ss": {
    "name": "Success Score",
    "group": "One-Pass Evaluation",
    "unit": "score"
  },
  "ope_nps": {
    "name": "Normalized Precision Score",
    "group": "One-Pass Evaluation",
    "unit": "score"
  },
  "ope_gsr": {
    "name": "Generalized Success Robustness Score",
    "group": "One-Pass Evaluation",
    "unit": "score"
  },
  "hoi_ss": {
    "name": "Success Score",
    "group": "Hand-Object Interaction Evaluation",
    "unit": "score"
  },
  "hoi_nps": {
    "name": "Normalized Precision Score",
    "group": "Hand-Object Interaction Evaluation",
    "unit": "score"
  },
  "hoi_gsr": {
    "name": "Generalized Success Robustness Score",
    "group": "Hand-Object Interaction Evaluation",
    "unit": "score"
  },
  "hoi_recall": {
    "name": "Recall",
    "group": "Hand-Object Interaction Evaluation",
    "unit": "score"
  }
},
  async fetch() {
    const t = tables((await fetchText(FEED)).replace(/\bname=([a-z_]+)(?=[ >])/g, 'name="$1"')).find(t => t[0]?.[0]?.text === 'TREK-150');
    const primary = t?.[2].find(c => c.attrs.class?.split(' ').includes('column-selected'))?.attrs.name;
    if (!t || primary !== 'mse_ss' || t.length < 6) throw new Error('Unexpected TREK-150 standings');
    return t.slice(3).map(row => {
      const metrics = Object.fromEntries(row.slice(4).map(c => [c.attrs.name, Number(c.text.match(/^([\d.]+)\s*\(/)?.[1])]));
      if (Object.keys(board.parts!).some(k => !Number.isFinite(metrics[k]))) throw new Error('Missing TREK-150 score');
      const date = row[3].text.match(/^(\d\d)\/(\d\d)\/(\d\d)$/);
      return { model: row[1].text, submitter: row[1].text, score: metrics[primary], metrics,
        date: date ? '20' + date[3] + '-' + date[1] + '-' + date[2] : undefined };
    });
  },
};
export default board;
