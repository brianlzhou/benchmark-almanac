// DCASE ranks Foley synthesis finalists by weighted listener rating. The Track A and B tables cover the same seven sound categories under different training-resource rules.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "dcase-foley-sound-synthesis-2023",
  url: "https://dcase.community/challenge2023/task-foley-sound-synthesis-results",
  feed: "https://dcase.community/challenge2023/task-foley-sound-synthesis-results",
  terms: "The organizers publish the scores. The results page names no license for score reuse. https://dcase.community/challenge2023/task-foley-sound-synthesis-results DCASE robots.txt permits the results path.",
  async fetch() {
    const all = tables(await fetchText(this.url));
    const judged = all.filter(t => t[0]?.some(c => c.text.startsWith('Weighted Average Score')));
    const screened = all.filter(t => t[1]?.some(c => c.text === 'Average FAD'));
    if (judged.length !== 2 || screened.length !== 2) throw new Error('DCASE tracks changed');
    return judged.flatMap((t,i) => {
      const parts = t[1].slice(4,11).map(c => c.text);
      this.parts = Object.fromEntries(parts.map(p => [p,p]));
      if (t.length < 7 || t[1][3].text !== 'Average Score' || parts.length !== 7) throw new Error('Missing listener ratings');
      return t.slice(2).map(r => {
        const metrics: Record<string,number> = {};
        for (const [j,c] of r.entries()) {
          if (j >= 5 && j <= 11) metrics[parts[j-5]] = Number(c.text);
        }
        for (const [j,key] of [[12,'audioQuality'],[20,'categoryFit'],[28,'diversity']] as const) if (r[j]?.text) metrics[key] = Number(r[j].text);
        const fad = screened[i].find(row => row[1]?.text === r[1].text);
        if (fad?.[6]?.text) metrics.fad = Number(fad[6].text);
        if (!r[4].text || !Object.values(metrics).every(Number.isFinite) || !Number.isFinite(Number(r[4].text))) throw new Error('Invalid listener rating');
        return {model:r[1].text,setting:i === 0 ? 'Track A' : 'Track B',score:Number(r[4].text),metrics};
      });
    });
  },
};
export default board;
