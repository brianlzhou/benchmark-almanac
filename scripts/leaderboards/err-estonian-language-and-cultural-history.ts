// ERR compares the number of correct answers across ten language and ten cultural history questions.
// The Infogram chart stacks the two published counts for each chatbot.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const feed = "https://e.infogram.com/4a6fb64b-aab0-4dfe-8698-e5ff6bffcb51?src=embed&embed_type=responsive_iframe";
const board: Leaderboard = {
  benchmark: "err-estonian-language-and-cultural-history",
  url: "https://e.infogram.com/4a6fb64b-aab0-4dfe-8698-e5ff6bffcb51?src=embed&embed_type=responsive_iframe",
  feed,
  terms: "ERR embeds the scores in an Infogram chart. The article does not specify an open license for the scores. Infogram robots.txt permits the embed.",
  parts: { history: 'Cultural history', estonian: 'Estonian' },
  aliases: { 'Chat GPT 5.2': 'gpt-5-2' },
  async fetch() {
    type Cell = { value: string } | null;
    const chart = jsonAfter<{ data: Cell[][][] }>(await fetchText(feed), '"chartData":');
    const sheet = chart.data[0];
    if (sheet.length < 7 || sheet[0][1]?.value !== 'cultural history' || sheet[0][2]?.value !== 'Estonian') throw new Error('Incomplete ERR chart');
    return sheet.slice(1).map(([name, first, second]) => {
      if (!name?.value || !first?.value?.trim() || !second?.value?.trim()) throw new Error('Missing ERR scores');
      const history = Number(first.value), estonian = Number(second.value);
      if (![history, estonian].every(n => Number.isInteger(n) && n >= 0 && n <= 10)) throw new Error('Invalid answer count');
      return { model: name.value, score: history + estonian, metrics: { history, estonian } };
    });
  },
};
export default board;
