// DrawingVQA tests reading and reasoning about construction drawings. The project site's CSV gives overall accuracy and the breakdowns displayed beside it.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const FEED = "https://joonv2.github.io/DrawingVQA/static/leaderboard/leaderboard.csv";
const fields = ['R1', 'R2', 'R3', 'VP', 'K', 'R', 'OCR', 'Adm.', 'EI', 'LU', 'DR', 'SU', 'QTO', 'Comp.'];

const board: Leaderboard = {
  benchmark: "drawingvqa",
  url: "https://joonv2.github.io/DrawingVQA/static/leaderboard/leaderboard.html",
  feed: FEED,
  terms: "The authors license question text under CC BY-NC-SA 4.0. The results table gives no separate score license. https://huggingface.co/datasets/S2-MIND/DrawingVQA The site returns a 404 page for robots.txt.",
  parts: Object.fromEntries(fields.map((name, i) => [name, { name, group: i < 3 ? 'Reasoning Depth' : i < 7 ? 'MLLM Dimensions' : 'Construction Eng. Domain Aspects' }])),
  async fetch() {
    const records = parseCsv(await fetchText(FEED)).filter((r) => r.Type !== '-');
    if (records.length < 19) throw new Error('Expected at least nineteen DrawingVQA models');
    return records.map((r) => {
      const numbers = Object.fromEntries(['Overall', ...fields].map((key) => {
        if (!r[key]?.trim() || !Number.isFinite(Number(r[key]))) throw new Error(`Invalid ${key} for ${r.Name}`);
        return [key, Number(r[key])];
      }));
      if (!r.Name) throw new Error('Missing DrawingVQA model');
      return { model: r.Name, score: numbers.Overall, metrics: numbers, open: r.Type === 'Open' ? true : undefined, link: r.Link || undefined };
    });
  },
};
export default board;
