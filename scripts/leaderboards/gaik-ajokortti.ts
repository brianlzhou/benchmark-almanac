// GAIK ranks Ajokortti transcriptions by mean meaning-error points per 100 reference words from two judges. Its README also lists WER and CER against Helsinki's original reference.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/GAIK-project/finnish-asr/main/README.md";

const board: Leaderboard = {
  benchmark: "gaik-ajokortti",
  url: "https://github.com/GAIK-project/finnish-asr#the-ajokortti-clip",
  feed,
  terms: "26 table rows. Count alternate decoding methods for the same checkpoint once. Use the original Helsinki reference for this table. Credit GAIK under CC BY 4.0. https://github.com/GAIK-project/finnish-asr#licences-attribution-and-credits The raw host returns 404 for robots.txt.",
  async fetch() {
    const article = await fetchText(feed);
    const t = markdownTables(article).find(t => t[0]?.join('|') === 'Model|Type|WER %|CER %|Claude pts|Gemini pts|Names (Claude / Gemini)');
    if (!t || t.length < 27 || !article.includes('Sorted by the mean of the two judges')) throw new Error('Missing Ajokortti ranking');
    return t.slice(1).map(r => {
      const wer = r[2].match(/^([\d.]+)(?: \(([\d.]+)–([\d.]+)\))?$/);
      const names = r[6].match(/^(\d+) \/ (\d+) of (\d+)$/);
      const [cer, claude, gemini] = r.slice(3, 6).map(Number);
      if (!wer || !names || ![cer, claude, gemini].every(Number.isFinite)) throw new Error('Invalid Ajokortti row');
      const chunked = r[0].endsWith(', chunked decoding');
      return { model: chunked ? r[0].slice(0, -', chunked decoding'.length) : r[0], setting: chunked ? 'chunked decoding' : undefined,
        score: (claude + gemini) / 2, open: r[1] === 'open', trials: wer[2] ? 3 : undefined,
        metrics: { wer: Number(wer[1]), cer, claude, gemini, claudeNames: Number(names[1]), geminiNames: Number(names[2]),
          ...(wer[2] ? { werMin: Number(wer[2]), werMax: Number(wer[3]) } : {}) } };
    });
  },
};

export default board;
