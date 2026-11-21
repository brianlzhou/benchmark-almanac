// The ICASSP challenge ranks teams by their predictions of overall song musicality.
// The organizers publish the weighted final scores in HTML and give a second ranking for fine-grained aesthetics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://aslp-lab.github.io/Automatic-Song-Aesthetics-Evaluation-Challenge/";


const board: Leaderboard = {
  benchmark: "icassp-song-aesthetics-2026",
  url: "https://aslp-lab.github.io/Automatic-Song-Aesthetics-Evaluation-Challenge/#leaderboard",
  feed,
  terms: "The results repository carries GPL version 3. https://raw.githubusercontent.com/ASLP-lab/Automatic-Song-Aesthetics-Evaluation-Challenge/main/LICENSE The results host serves no robots.txt rules.",
  parts: { fine: 'Fine-Grained Aesthetic Dimension Prediction' },
  async fetch() {
    const page = await fetchText(feed);
    function ranking(id: string) {
      const index = page.indexOf('id="' + id + '"');
      if (index < 0) throw new Error('Missing track: ' + id);
      const t = tables(page.slice(index))[0];
      if (t?.[0].map(c => c.text).join('|') !== 'Rank|Team Name|Score') throw new Error('Missing team scores');
      return new Map(t.slice(1).map(row => {
        const score = Number(row[2].text);
        if (!row[1].text || !Number.isFinite(score)) throw new Error('Invalid team score');
        return [row[1].text,score];
      }));
    }
    const overall = ranking('track-1-overall-musicality-score-prediction');
    const fine = ranking('track-2-fine-grained-aesthetic-dimension-prediction');
    if (overall.size < 19 || fine.size < 17) throw new Error('Missing challenge teams');
    return [...overall].map(([model,score]) => ({ model, submitter: model, score, metrics: fine.has(model) ? { fine: fine.get(model)! } : undefined }));
  },
};
export default board;
