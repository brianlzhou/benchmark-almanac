// DCASE ranks its five language-queried audio separation finalists by the average listening-test rating.
// The results page gives audio quality, relevance and objective measurements for the same submissions.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://dcase.community/challenge2024/task-language-queried-audio-source-separation-results";
const board: Leaderboard = {
  benchmark: "dcase-2024-language-queried-audio-source-separation",
  url: "https://dcase.community/challenge2024/task-language-queried-audio-source-separation-results",
  feed,
  terms: "The evaluation dataset lists CC BY 4.0. The results page gives no separate score license. The site's robots.txt allows the results page.",
  stats: { ovl: { name: 'Overall quality', unit: 'score', better: 'higher' }, rel: { name: 'Relevance', unit: 'score', better: 'higher' }, sdr: { name: 'Source to distortion ratio', unit: 'score', better: 'higher' }, sdri: { name: 'Source to distortion ratio improvement', unit: 'score', better: 'higher' }, siSdr: { name: 'Scale-invariant source to distortion ratio', unit: 'score', better: 'higher' }, devSdr: { name: 'Development source to distortion ratio', unit: 'score', better: 'higher' }, devSdri: { name: 'Development source to distortion ratio improvement', unit: 'score', better: 'higher' }, devSiSdr: { name: 'Development scale-invariant source to distortion ratio', unit: 'score', better: 'higher' } },
  async fetch() {
    const data = tables(await fetchText(feed));
    const subjective = data.find(t => t[1]?.slice(-3).map(c => c.text).join('|') === 'Average Score|OVL Score|REL Score');
    const objective = data.find(t => t[1]?.some(c => c.text === 'SDR Rank'));
    if (!subjective || subjective.length < 7 || !objective) throw new Error('Missing DCASE results');
    return subjective.slice(2).map(c => {
      const model = c[1].text;
      const obj = objective.slice(2).find(r => r[1].text === model);
      const href = c[2].html.match(/href="([^"]+)"/)?.[1];
      const values = [...c.slice(4, 7), ...(obj?.slice(4, 10) ?? [])].map(cell => cell.text ? Number(cell.text) : NaN);
      if (!model || values.length !== 9 || !values.every(Number.isFinite)) throw new Error('Incomplete DCASE finalist');
      const [score, ovl, rel, sdr, sdri, siSdr, devSdr, devSdri, devSiSdr] = values;
      return { model, score, link: href ? new URL(href, feed).href : undefined, metrics: { ovl, rel, sdr, sdri, siSdr, devSdr, devSdri, devSiSdr } };
    });
  },
};
export default board;
