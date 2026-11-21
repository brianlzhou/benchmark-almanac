// AutoResearchExam (Bespoke Labs) on benchmarks.bespokelabs.ai/autoresearchexam/. The page's static HTML
// includes a server-rendered efficiency chart with one point per model at release (2026-09-09), each carrying
// data-model and data-score-value, the mean hidden-test AUARC (0 to 1) after 24 hours, which is the board's
// headline; it is read as is, matching the record's "score" unit. Newer live chart scripts publish
// explicit aggregate objects for additional models. Read those as data, without evaluating JavaScript.
// The chart's x value, data-resource-value (mean number of submissions per task), is kept as
// metrics.submissions, and the release feed pairs mean cost and output tokens with each aggregate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, jsonAfter } from '../lib/html.ts';

const PAGE = 'https://benchmarks.bespokelabs.ai/autoresearchexam/';

const board: Leaderboard = {
  benchmark: 'autoresearchexam',
  url: PAGE,
  feed: `${PAGE} (static efficiency chart plus live script aggregate objects)`,
  terms: 'Public Bespoke Labs page; benchmarks.bespokelabs.ai serves no robots.txt (404) and the page states no reuse limits.',
  chart: {
    title: 'API cost vs. test AUARC',
    note: 'Mean API cost and mean test AUARC across the evaluated tasks.',
    x: { key: 'cost', label: 'Mean API cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Mean test AUARC', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const rows = new Map<string, LeaderboardRow>();
    for (const m of html.matchAll(/<g class="model-dot efficiency-point"[^>]*>/g)) {
      const attr = (k: string) => m[0].match(new RegExp(`${k}="([^"]*)"`))?.[1];
      if (attr('data-score-label') !== 'Mean test AUARC') continue;
      const model = text(attr('data-model') ?? '');
      const score = Number(attr('data-score-value'));
      const submissions = attr('data-resource-label') === 'Mean number of submissions per task' ? Number(attr('data-resource-value')) : NaN;
      if (model && Number.isFinite(score)) rows.set(model, { model, score, metrics: Number.isFinite(submissions) ? { submissions } : undefined });
    }
    if (!rows.size) throw new Error('no AUARC points found');
    const site = html.match(/<script[^>]*src="([^"]*site-data\.js[^"]*)"/)?.[1];
    if (site) {
      const script = await fetchText(new URL(site, PAGE).href);
      interface Run { model: string; outputTokens?: number; requests?: number; workHours?: number }
      interface Aggregate { key: string; name: string; test: number; test_ci: number[]; cost: number;
        validation: number; final: number; gap: number; elo: number; taskCount: number }
      const data = jsonAfter<{aggregates: Aggregate[]; tasks: {models: Run[]}[]}>(script, 'window.ARB_DATA =');
      for (const a of data.aggregates) {
        const row = rows.get(a.name);
        if (!row || Math.abs(row.score - a.test) > 0.00051) continue;
        row.cost = a.cost;
        [row.low, row.high] = a.test_ci;
        row.metrics = {...row.metrics, validation: a.validation, final: a.final, gap: a.gap, elo: a.elo, tasks: a.taskCount};
        const runs = data.tasks.flatMap(t => t.models.filter(m => m.model === a.key));
        if (!runs.length || runs.length !== a.taskCount) continue;
        const mean = (key: 'outputTokens' | 'requests' | 'workHours') => {
          const values = runs.map(run => run[key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
          return values.length === runs.length ? values.reduce((a,b) => a+b,0) / values.length : undefined;
        };
        row.tokens = mean('outputTokens');
        const requests = mean('requests'), hours = mean('workHours');
        if (requests !== undefined) row.metrics.requests = requests;
        if (hours !== undefined) row.metrics.workSeconds = hours * 3600;
      }
    }
    const paths = [...html.matchAll(/<script[^>]*src="([^"]*(?:live-leaderboard|argon-live-data)\.js[^\"]*)"/g)].map(m=>m[1]);
    if(paths.length!==2)throw new Error('AutoResearchExam live data scripts changed');
    for(const path of paths){
      await new Promise(r=>setTimeout(r,1100));
      const script=await fetchText(new URL(path,PAGE).href);
      for(const match of script.matchAll(/const (\w+_LIVE)\s*=/g)){
        const value=jsonAfter<{aggregate:{name:string;test:number;test_ci:number[];cost:number;costEstimated?:boolean}}>(script,match[0]);
        const a=value.aggregate;if(!a||!Number.isFinite(a.test)||!Number.isFinite(a.cost))throw new Error('Invalid live aggregate');
        const model=a.name==='Argon'?'Gemini 4 Argon':a.name==='Opus 5.5'?'Claude Opus 5.5':a.name;
        rows.set(model,{model,score:a.test,cost:a.cost,low:a.test_ci[0],high:a.test_ci[1],metrics:{costEstimated:a.costEstimated?1:0}});
      }
    }
    return [...rows.values()];
  },
};
export default board;
