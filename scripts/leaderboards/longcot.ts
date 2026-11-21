// LongCoT ranks raw models and tool-assisted runs by overall accuracy on five reasoning domains.
// Its page reads the raw model JSON and adds harness results from numeric literals in the page script.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const url = 'https://longcot.ai';
const feed = url + '/data/results.json';
const parts = { logic: 'Logic', cs: 'CS', chemistry: 'Chemistry', chess: 'Chess', math: 'Math' };
interface Model { name: string; type: string; contributor: string; avg_tokens: number | null; longcot: Record<string, number> }
function scores(raw: Record<string, number>) {
  if (!['overall', ...Object.keys(parts)].every(k => Number.isFinite(raw?.[k]))) throw new Error('Missing LongCoT accuracy');
  const { overall: score, ...metrics } = raw;
  return { score, metrics };
}
const board: Leaderboard = {
  benchmark: 'longcot', url, feed, parts,
  terms: 'Public results and leaderboard script published by the LongCoT team.',
  verified: 'no pending verification flag on the board',
  async fetch() {
    const { models } = await fetchJson<{ models: Model[] }>(feed);
    if (models.length < 7) throw new Error('Missing LongCoT raw runs');
    const rows: LeaderboardRow[] = models.map(m => ({
      model: m.name, ...scores(m.longcot), open: m.type === 'open', tokens: m.avg_tokens ?? undefined,
      submitter: m.contributor, setting: 'Raw LLM', verified: true,
    }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    const html = await fetchText(url);
    const src = html.match(/src="(js\/main\.js[^"]*)"/)?.[1];
    if (!src) throw new Error('Missing LongCoT leaderboard script');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const js = await fetchText(new URL(src, url).href);
    const names = new Map([...js.matchAll(/const (\w+) = ensureModel\('([^']+)'/g)].map(m => [m[1], m[2]]));
    const original = js.match(/const (\w+) = data\.models\.find\(model => model\.name === '([^']+)'/);
    if (original) names.set(original[1], original[2]);
    for (const m of js.matchAll(/(\w+)\.(open_harness|restricted_harness) = (\{\s*longcot:)/g)) {
      const [variable, track] = [m[1], m[2]];
      const model = names.get(variable);
      const harness = js.match(new RegExp(variable + '\\.harness\\.' + track + " = '([^']+)'"))?.[1];
      if (!model || !harness) throw new Error('Unrecognized LongCoT harness run');
      const data = jsLiteral<{ longcot: Record<string, number> }>(js, m.index! + m[0].indexOf('{'));
      const link = js.match(new RegExp(variable + '\\.harness_url\\.' + track + " = '([^']+)'"))?.[1];
      const published = models.find(m => m.name === model);
      rows.push({ model, ...scores(data.longcot), harness, link, setting: track === 'open_harness' ? 'Open Harness' : 'Restricted Harness',
        verified: !js.includes(variable + '.pending_verification.' + track + ' = true'), open: published ? published.type === 'open' : true,
        submitter: published?.contributor ?? js.match(/contributor: '([^']+)'/)?.[1],
      });
    }
    if (rows.length - models.length < 4) throw new Error('Incomplete LongCoT harness results');
    return rows;
  },
};
export default board;
