// Sugar's Kitchen ranks five cooking personas by the two judges' total out of 50.
// These totals come from the result image embedded in the organizer's post.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = "https://assets.st-note.com/img/1788343264-bpD7ZaRqvFm5e3tCnQHWj6X8.png?width=1200";

const board: Leaderboard = {
  benchmark: "sugars-kitchen-ai-cooking-battle-17",
  static: 'paper',
  url: "https://note.com/sugar_arc_works/n/n8eb45d051541",
  feed: FEED,
  terms: "The organizer permits use of the recipes. The post gives no separate license for the standings or artwork. https://note.com/sugar_arc_works/n/n8eb45d051541 The note.com robots file restricts API paths and allows this article.",
  async fetch() {
    return chartRows(FEED, '32c50d1c922e9ec74be614303855b0db5f3215200b16d6e37645a04a54d3d42b', [
      { model: 'パーシー (ChatGPT)', score: 46 },
      { model: 'フギン (Claude Fable)', score: 45 },
      { model: 'ナナ (Claude Opus)', score: 41 },
      { model: 'おジェミ (Gemini)', score: 37 },
      { model: 'ぽじた (Grok)', score: 37 },
    ]);
  },
};
export default board;
