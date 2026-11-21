// DCASE 2025 ranks audio question answering systems by average accuracy across three evaluation domains.
// The overall results table also gives each domain and the development-set average.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://dcase.community/challenge2025/task-audio-question-answering-results";
const feed = url;

const board: Leaderboard = {
  benchmark: 'dcase-2025-audio-question-answering', url, feed,
  terms: "DCASE lists no separate terms for scores. Its robots.txt restricts images and theme assets and allows the results page.",
  aliases: { Baseline_Qwen2_Audio: 'qwen2-audio-7b-instruct', Baseline_Kimi_Audio: 'kimi-audio-7b-instruct',
    Baseline_Gemini_2_0: 'gemini-2-0-flash-feb-2025' },
  parts: { part1: 'Part 1 Accuracy', part2: 'Part 2 Accuracy', part3: 'Part 3 Accuracy' },
  async fetch() {
    const page = await fetchText(feed);
    const reports = new Map<string, string>();
    for (const section of page.split('<div class="panel-heading').slice(1)) {
      const pdf = section.match(/href="([^"]+\.pdf)"/)?.[1];
      if (pdf) for (const code of section.matchAll(/class="label label-primary">([^<]+)</g)) reports.set(code[1], new URL(pdf, url).href);
    }
    const table = tables(page).find(t => t[1]?.[1]?.text === 'Corresponding Author' &&
      t[1]?.map(c => c.text).join('|') === 'Submission Code|Corresponding Author|Technical Report|Domain Average|Part 1 Accuracy|Part 2 Accuracy|Part 3 Accuracy|Domain Average|Amount of Parameters');
    if (!table || table.length < 33) throw new Error('Incomplete DCASE overall ranking');
    return table.slice(2).map(c => {
      if (!c[1]?.text || c.length !== 10 || c.slice(4,9).some(x => !/^\d+(?:\.\d+)?$/.test(x.text))) throw new Error('Invalid DCASE result');
      const [score, part1, part2, part3, devAverage] = c.slice(4,9).map(x => Number(x.text));
      return { model: c[1].text, score, link: reports.get(c[1].text), submitter: c[2].text || undefined, metrics: { part1, part2, part3, devAverage },
        params: c[9].text ? Number(c[9].text) / 1e9 : undefined };
    });
  },
};
export default board;
