// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// FrontierCAD tests CAD reconstruction and assembly placement. The technical report gives each track mean
// and its bootstrap interval. A partial mean covers only scored trials, so only complete runs are comparable.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://normal.ai/research/frontiercad';
const feed = url + '/technical-report';
const board: Leaderboard = {
  benchmark: 'frontiercad', harnesses: 'system', url, feed, parts: { parts: 'Parts', assemblies: 'Assemblies' },
  terms: 'Normal Research publishes aggregate results in its technical report. https://normal.ai/research/frontiercad/technical-report',
  stats: { partsPassed: { name: 'Parts passed', unit: 'count' }, assembliesPassed: { name: 'Assemblies passed', unit: 'count' } },
  async fetch() {
    const html = await fetchText(feed);
    const groups = tables(html).filter(t => t[0]?.map(c => c.text).join() === 'Model and setting,Scored,Mean,Passed');
    if (groups.length !== 2) throw new Error('Missing FrontierCAD results');
    const intervals = [...html.matchAll(/aria-label="([^"]+): Mean ([\d.]+); 95% uncertainty interval ([\d.]+) to ([\d.]+)\. (\d+)\/(\d+) scored trials\."/g)];
    const models = new Map<string, LeaderboardRow>();
    groups.forEach((table, i) => {
      const key = i === 0 ? 'parts' : 'assemblies';
      const total = i === 0 ? 39 : 16;
      for (const [identity, count, mean, passes] of table.slice(1)) {
        const [name, description] = identity.html.split(/<br\s*\/?\s*>/i);
        const model = text(name);
        const [harness, setting] = text(description).split(/\s*·\s*/);
        const [scored, scheduled] = count.text.split('/').map(Number);
        const value = Number(mean.text);
        const interval = intervals.find(m => m[1] === model && Number(m[6]) === total);
        if (scheduled !== total || !interval || Number(interval[2]) !== value || Number(interval[5]) !== scored)
          throw new Error('FrontierCAD chart and table disagree');
        if (scored !== scheduled) continue;
        const row = models.get(model) ?? { model, harness, setting, trials: 1, score: 0, metrics: {} };
        if (row.setting !== setting || row.harness !== harness) throw new Error('Settings differ across tracks');
        Object.assign(row.metrics!, { [key]: value, [key+'Low']: Number(interval[3]), [key+'High']: Number(interval[4]),
          [key+'Passed']: Number(passes.text.split('/')[0]) });
        models.set(model, row);
      }
    });
    const complete = [...models.values()].filter(({ metrics }) => metrics!.parts !== undefined && metrics!.assemblies !== undefined);
    for (const row of complete) row.score = (row.metrics!.parts + row.metrics!.assemblies) / 2;
    return checked(complete, 5);
  },
};
export default board;
