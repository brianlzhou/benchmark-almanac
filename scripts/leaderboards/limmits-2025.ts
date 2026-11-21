// LIMMITS rates speech naturalness under three track conditions. Its results page embeds drawings with mean ratings and standard deviations for naturalness and speaker similarity.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://sites.google.com/view/limmits25/results";
const board: Leaderboard = {
  benchmark: 'limmits-2025',
  url: "https://sites.google.com/view/limmits25/results",
  feed,
  terms: "Google Sites allows this public results path. Six entries appear in the Track 1 naturalness table. Tracks 2 and 3 have three and one. The site identifies no score reuse license. https://sites.google.com/view/limmits25/results",
  stats: { speakerSimilarity: { name: 'Speaker similarity', unit: 'rating', better: 'higher' } },
  async fetch() {
    const page = await fetchText(feed);
    const rows = [];
    for (const [track, minimum] of [[1, 6], [2, 3], [3, 1]]) {
      const read = async (kind: string, column: string) => {
        const frame = page.match(new RegExp('aria-label="Drawing, track ' + track + ' ' + kind + '" src="(https://docs.google.com/drawings/d/[^/]+)/'));
        if (!frame) throw new Error('Missing drawing for track ' + track);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const source = await pdfText(frame[1] + '/export/pdf');
        if (!source.includes(column + '(avg)') || !source.includes(column + '(std)')) throw new Error('Missing rating columns');
        const entries = new Map<string, number[]>();
        for (const m of source.matchAll(/^\s*(\S+)\s+([\d.]+)\s+([\d.]+)\s*$/gm)) entries.set(m[1], [Number(m[2]), Number(m[3])]);
        if (entries.size < minimum) throw new Error('Missing track ' + track + ' scores');
        return entries;
      };
      const ratings = await read('nat', 'MOS');
      const similarity = await read('sim', 'Score');
      for (const [model, [score, naturalnessStd]] of ratings) {
        const sim = similarity.get(model);
        if (!sim) throw new Error('Missing speaker similarity for ' + model);
        rows.push({ model, submitter: model, setting: 'Track ' + track, score,
          metrics: { naturalnessStd, speakerSimilarity: sim[0], similarityStd: sim[1] } });
      }
    }
    return rows;
  },
};
export default board;
