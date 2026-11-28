// VATEX English captioning challenge: published CIDEr is the headline score.
// Chinese captions belong to the separate vatex-zh record. BLEU-4, Meteor and
// Rouge-L remain metrics; named team submissions stay unlisted systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://eric-xw.github.io/vatex-website/captioning.html";
const board: Leaderboard = {
  benchmark: "vatex", url: "https://eric-xw.github.io/vatex-website/captioning.html", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  stats: {
    'BLEU-4': { name: 'BLEU-4 score', unit: '%', better: 'higher' },
    Meteor: { name: 'METEOR', unit: '%', better: 'higher' },
    'Rouge-L': { name: 'ROUGE-L', unit: '%', better: 'higher' },
  },
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source);
    const rows: LeaderboardRow[] = [];
    for (const [i, table] of all.filter(t => t[0]?.some(c => c.text === "CIDEr")).entries()) {
      for (const r of table.slice(1)) {
        const score = num(r[5]?.text);
        if (score === undefined) continue;
        const name = r[1]?.text ?? '';
        const team = /baseline/i.test(name) ? undefined : name.replace(/\s+\([^()]*\d{4}\)$/, '');
        const link = r[1]?.html.match(/href="\s*(https?:\/\/[^"\s]+)\s*"/)?.[1]?.replace(/&amp;/g, '&');
        rows.push({
          model: name, submitter: team, link, score, setting: i === 0 ? "English" : "Chinese",
          metrics: Object.fromEntries(table[0].slice(2, 5).flatMap((h, j) => {
            const v = num(r[j + 2]?.text);
            return v === undefined ? [] : [[h.text, v]];
          })),
        });
      }
    }
    if (!rows.length) throw new Error("No vatex score rows");
    return rows.filter(r=>r.setting==="English");
  },
};
export default board;
