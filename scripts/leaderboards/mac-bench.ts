// Multi Agent Coordination Bench (MAC Bench): twelve four-hour tasks built for teams, where one agent's work depends
// on its teammates'. A deterministic grader scores each run from 0 to 1 at the four-hour mark. Each model runs every
// task three ways: one agent, eight agents with a shared message board, and eight agents with no way to talk. The
// headline is the leaderboard's team score, the mean final score of eight coordinating agents. The single agent's
// score, the score of eight agents without coordination, and the two gains go in metrics. The importer reads the
// tooltips of the leaderboard chart, which give each part with a 95% interval. Cost is the mean over the twelve
// tasks of each task's mean cost per run for the coordinating team, from the per-task run tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const URL = 'https://benchmarks.bespokelabs.ai/multi-agent-coordination-bench/';
const NUM = String.raw`([+−-]?[\d.]+)`;

const board: Leaderboard = {
  benchmark: 'mac-bench',
  url: URL,
  feed: URL,
  terms: 'Bespoke Labs publishes the report and leaderboard. The tasks and harness code are Apache-2.0. https://github.com/bespokelabsai/multi-agent-coordination-bench',
  stats: { singleAgent:{name:'Single-agent score',unit:'score',better:'higher'}, moreAgentsGain:{name:'Gain from more agents',unit:'score',better:'higher'}, coordinationGain:{name:'Gain from coordination',unit:'score',better:'higher'}, uncoordinated:{name:'Uncoordinated team score',unit:'score',better:'higher'} },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(URL);
    const chart = html.slice(html.indexOf('class="gs-name"'), html.indexOf('class="gs-axis"'));
    const val = (s: string) => Number(s.replace('−', '-'));
    const parts = new Map<string, Record<string, number>>();
    for (const m of chart.matchAll(new RegExp(String.raw`data-tip="([^",]+), (single agent|gain from more agents|gain from coordination): ${NUM} \(95% interval ${NUM} to ${NUM}\)"`, 'g'))) {
      const p = parts.get(m[1]) ?? {};
      const key = { 'single agent': 'singleAgent', 'gain from more agents': 'moreAgentsGain', 'gain from coordination': 'coordinationGain' }[m[2]]!;
      p[key] = val(m[3]);
      p[`${key}Low`] = val(m[4]);
      p[`${key}High`] = val(m[5]);
      parts.set(m[1], p);
    }
    // per-task run tables: mean cost per run of the coordinating team in each task, then the mean over tasks
    const runs = tables(html).filter((t) => t[0]?.map((c) => c.text).join('|').startsWith('Model|Setting|Run|Final score|Cost'));
    if (runs.length !== 12) throw new Error(`Expected 12 task tables, read ${runs.length}`);
    const costOf = (model: string) => {
      const perTask = runs.map((t) => {
        const c = t.slice(1).filter((r) => r[0].text === model && r[1].text === '8 agents').map((r) => Number(r[4].text.replace(/[$,]/g, '')));
        return c.length && c.every(Number.isFinite) ? c.reduce((a, b) => a + b, 0) / c.length : NaN;
      });
      return perTask.every(Number.isFinite) ? perTask.reduce((a, b) => a + b, 0) / perTask.length : undefined;
    };
    const rows: LeaderboardRow[] = [];
    for (const [model, p] of parts) {
      if (!['singleAgent', 'moreAgentsGain', 'coordinationGain'].every((k) => k in p)) throw new Error(`Incomplete chart parts for ${model}`);
      // the team's score is the single agent's plus both gains, the end of the arrow in the chart
      const team = Math.round((p.singleAgent + p.moreAgentsGain + p.coordinationGain) * 1000) / 1000;
      const cost = costOf(model);
      rows.push({ model, score: team, setting: 'eight agents with a shared message board', trials: 3, ...(cost ? { cost } : {}),
        metrics: { ...p, uncoordinated: Math.round((p.singleAgent + p.moreAgentsGain) * 1000) / 1000 } });
    }
    // the chart prints each team score beside its bar, so check the sums against those labels
    const labels = [...chart.matchAll(/<em style="[^"]*">([\d.]+)<\/em>/g)].map((m) => Number(m[1]));
    if (rows.length < 3 || labels.length !== rows.length || rows.some((r, i) => Math.abs(r.score - labels[i]) > 0.0015))
      throw new Error(`MAC Bench chart changed: read ${rows.length} models, labels ${labels.join(', ')}`);
    return rows;
  },
};
export default board;
