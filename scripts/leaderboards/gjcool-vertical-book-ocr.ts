// GJ.cool measures recognition accuracy on vertical Chinese books. Two article tables publish overall accuracy and accuracy by page type.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://ocr.gj.cool/article/2026-04-03-ocr-model";

const board: Leaderboard = {
  benchmark: "gjcool-vertical-book-ocr",
  url: "https://ocr.gj.cool/article/2026-04-03-ocr-model",
  feed,
  terms: "GJ.cool reserves all rights. Count only rows with a vertical accuracy value. https://ocr.gj.cool/article/2026-04-03-ocr-model The robots.txt URL serves an HTML page.",
  parts: { sparse: '夹注少', dense: '夹注多', manuscripts: '写本' },
  async fetch() {
    const all = tables(await fetchText(feed));
    const totals = all.find(t => t[0]?.[4]?.text === '竖排');
    const detail = all.find(t => t[0]?.[4]?.text === '写本');
    if (!totals || !detail || detail.length < 7) throw new Error('Missing GJ.cool results');
    const rows = totals.slice(1).filter(r => r[4].text.trim()).map(r => {
      const fullName = r[0].text, model = fullName.replace(/ \(no think\)$/, '');
      const split = detail.find(line => line[0].text === fullName);
      const score = num(r[4].text);
      if (score == null || (split && num(split[1].text) !== score)) throw new Error('Invalid vertical OCR result');
      const metrics: Record<string, number> = {};
      if (split) for (const [i, key] of Object.keys(board.parts!).entries()) {
        const value = num(split[i + 2].text);
        if (value == null) throw new Error('Missing vertical OCR page score');
        metrics[key] = value;
      }
      return { model, setting: fullName === model ? undefined : 'no think', score, params: num(r[2].text), metrics };
    });
    if (rows.length < 7) throw new Error('Expected seven vertical OCR scores');
    return rows;
  },
};

export default board;
