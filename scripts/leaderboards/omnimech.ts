// OmniMech ranks CAD reconstructions by relative volume error. The project page embeds separate zero-shot input and agent feedback configurations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://www.omnieda.com/mech/";

const board: Leaderboard = {
  benchmark: "omnimech",
  url: "https://www.omnieda.com/mech/#zeroshot-results",
  feed: FEED,
  terms: "The results page gives no score reuse license. https://www.omnieda.com/mech/ The site allows crawling.",
  async fetch() {
    const page = await fetchText(FEED);
    if (!page.includes("'Vol. err. % ↓','Time s ↓','Pass % ↑'")) throw new Error('Changed OmniMech columns');
    const metricsKeys = ['cd','siou','viou','fscore','surfaceError','surfaceErrorPct','volumeError','volumeErrorPct','latency','passRate','inputTokens','outputTokens','cadOps','selfStop','iterations'];
    return ['zeroRows', 'agentRows'].flatMap(name => {
      const block = page.split('const '+name+' = [')[1]?.split('];')[0];
      if (!block) throw new Error('Missing '+name);
      const rows = [...block.matchAll(/\[('[^'\]]*'(?:\s*,\s*'[^'\]]*')*)\]/g)].flatMap(m => {
        const [model,variant,...values] = [...m[1].matchAll(/'([^']*)'/g)].map(x => x[1]);
        if (values[7] === '—') return [];
        if (!model || !variant || values.length !== (name === 'zeroRows' ? 13 : 15)) throw new Error('Changed CAD row');
        const metrics: Record<string,number> = {};
        values.forEach((s,i) => { if (s !== '—') { if (!Number.isFinite(Number(s))) throw new Error('Invalid CAD metric'); metrics[metricsKeys[i]] = Number(s); } });
        return [{ model, setting: (name === 'zeroRows' ? 'Zero-shot / ' : 'Agent / ') + variant, score: metrics.volumeErrorPct, tokens: metrics.outputTokens, metrics }];
      });
      if (rows.length < (name === 'zeroRows' ? 32 : 15)) throw new Error('Missing scored CAD configurations');
      return rows;
    });
  },
};
export default board;
