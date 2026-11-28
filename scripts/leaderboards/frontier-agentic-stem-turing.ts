// Turing reports the mean pass rate across three runs on 805 scientific computing tasks.
// Its public app bundle contains the model table, pooled standard errors and sub-domain results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const url = 'https://labs.turing.com/benchmarks/frontier-agentic-stem';
export async function turingPage(page: string, slug: string) {
  const root = new URL('/', page).href;
  const script = (await fetchText(root)).match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
  if (!script) throw new Error('Missing Turing app script');
  await new Promise(resolve => setTimeout(resolve, 1000));
  const js = await fetchText(new URL(script, root).href);
  const start = js.indexOf('slug:"' + slug + '"');
  if (start < 0) throw new Error('Cannot find Turing page ' + slug);
  return js.slice(start).split(/,\w+=\{slug:/, 1)[0];
}
function table(page: string, first: string) {
  const start = page.indexOf('headers:["' + first + '"');
  if (start < 0) throw new Error('Missing table ' + first);
  const section = page.slice(start);
  const cols = jsonAt<string[]>(section, section.indexOf('['));
  // In model tables the app wraps the model label in a display function with a subtitle.
  const data = section.slice(section.indexOf('rows:') + 5).replace(/\w+\(("([^"\\]|\\.)*"),("([^"\\]|\\.)*")\)/g, '[$1,$3]');
  return { cols, data: jsonAt<(string | string[])[][]>(data, 0) };
}

const board: Leaderboard = {
  benchmark: 'frontier-agentic-stem-turing', url, feed: 'https://labs.turing.com/',
  terms: 'The robots.txt URL serves the app. Turing gives no separate reuse license on the benchmark page.',
  reference: ['Terminus-2'],
  parts: {
    domain0: { name: 'Physics', group: 'Sub-domain', unit: '%' },
    domain1: { name: 'Biology', group: 'Sub-domain', unit: '%' },
    domain2: { name: 'Mathematics', group: 'Sub-domain', unit: '%' },
    domain3: { name: 'Chemistry', group: 'Sub-domain', unit: '%' },
    domain4: { name: 'Mathematics and Theoretical Sciences', group: 'Sub-domain', unit: '%' },
    domain5: { name: 'Computational Chemistry', group: 'Sub-domain', unit: '%' },
    domain6: { name: 'Computational and Theoretical Chemistry', group: 'Sub-domain', unit: '%' },
    domain7: { name: 'Computational Physics', group: 'Sub-domain', unit: '%' },
    domain8: { name: 'Computational Biology', group: 'Sub-domain', unit: '%' },
    domain9: { name: 'Chemistry and Molecular Engineering', group: 'Sub-domain', unit: '%' },
    domain10: { name: 'Data Science', group: 'Sub-domain', unit: '%' },
    domain11: { name: 'Biophysics', group: 'Sub-domain', unit: '%' },
  },
  stats: { passed: { name: 'Rollouts passed', unit: 'count' }, steps: { name: 'Mean steps', unit: 'count' }, toolCalls: { name: 'Mean tool calls', unit: 'count' }, latency: { name: 'Runtime', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const page = await turingPage(url, 'frontier-agentic-stem');
    const results = table(page, 'Model","Pass rate');
    if (results.cols.join('|') !== 'Model|Pass rate|Rollouts passed|Mean steps|Mean tool calls|Runtime|Mean $/run') throw new Error('Turing changed the model table');
    const rows: LeaderboardRow[] = results.data.map(([label, pass, count, steps, tools, runtime, cost]) => {
      if (!Array.isArray(label)) throw new Error('Missing model and setting');
      const m = /^(\d+(?:\.\d+)?)% ±([\d.]+)$/.exec(String(pass));
      if (!m) throw new Error('Invalid reported pass rate');
      const score = Number(m[1]);
      return { model: label[0], setting: label[1].split(' · ')[1], harness: 'Terminus-2', trials: 3, score,
        low: score - Number(m[2]), high: score + Number(m[2]), cost: Number(String(cost).replace('$','')),
        metrics: { passed: Number(String(count).split('/')[0].replaceAll(',','')), steps: Number(steps), toolCalls: Number(tools),
          latency: Number(String(runtime).replace(/m$/, '')) * 60 } };
    });
    const sub = table(page, 'Sub-domain');
    for (let idx = 0; idx < sub.data.length; idx++) {
      const entry = sub.data[idx];
      const key = 'domain' + idx;
      for (const row of rows) {
        const i = sub.cols.indexOf(row.model);
        if (i < 0 || !Number.isFinite(Number(entry[i]))) throw new Error('Missing sub-domain score: ' + row.model);
        row.metrics![key] = Number(entry[i]);
      }
    }
    if (rows.length < 5 || sub.data.length < 12) throw new Error('Incomplete Turing tables');
    return rows;
  },
};
export default board;
