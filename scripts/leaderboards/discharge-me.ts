// Discharge Me! ranks submitted systems on clinical discharge documentation. The organizers' automatic evaluation sheet publishes an overall score and eight component measures.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://docs.google.com/spreadsheets/d/1idtYUQv4Npr142mEDQngZ8fNLwO9xOblC7Pjzli6fx4/export?format=csv";
const categories = ["BLEU", "ROUGE-1", "ROUGE-2", "ROUGE-L", "BERTScore", "Meteor", "AlignScore", "MEDCON"];

const board: Leaderboard = {
  benchmark: "discharge-me",
  url: "https://docs.google.com/spreadsheets/d/1idtYUQv4Npr142mEDQngZ8fNLwO9xOblC7Pjzli6fx4/edit?usp=sharing",
  feed: FEED,
  terms: "The organizers publish final scores by team. The score sheet gives no explicit score reuse license. https://docs.google.com/spreadsheets/d/1idtYUQv4Npr142mEDQngZ8fNLwO9xOblC7Pjzli6fx4/edit?usp=sharing Google requests a one-second crawl delay.",
  async fetch() {
    const records = parseCsv((await fetchText(FEED)).trimStart());
    if (records.length < 17) throw new Error('Expected at least 17 results');
    return records.map((r) => {
      const number = (column: string) => {
        if (!r[column]?.trim() || !Number.isFinite(Number(r[column]))) throw new Error(`Missing ${column} for ${r["Team"]}`);
        return Number(r[column]);
      };
      const model = r["Team"];
      if (!model) throw new Error('Missing model name');
      return { model, score: number("Overall"), metrics: Object.fromEntries(categories.map((key) => [key, number(key)])) };
    });
  },
};
export default board;
