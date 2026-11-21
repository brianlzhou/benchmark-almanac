// UserBench measures agreement with a developer's next action labels using mean Jaccard similarity.
// The results component in the authors' website repository supplies the exact values behind its rounded chart labels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import ts from 'typescript';

const feed = 'https://raw.githubusercontent.com/cooperbench/user.skill/benchmark-website/web/app/SolHighResults.tsx';
const board: Leaderboard = {
  benchmark: 'userbench-developer-simulation', url: 'https://userbench.vercel.app', feed,
  terms: 'The authors link the public website source. The website has no robots.txt and the raw source permits this path.',
  stats: {
    exact: { name: 'Exact agreement', unit: '%', better: 'higher' },
    chance: { name: 'Chance baseline', unit: '%', better: 'higher' },
    cacheHit: { name: 'Cache hit rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const file = ts.createSourceFile('results.tsx', await fetchText(feed), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const objects = new Map<string, ts.Expression>();
    for (const statement of file.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const decl of statement.declarationList.declarations) {
        if (decl.initializer) objects.set(decl.name.getText(), decl.initializer);
      }
    }
    function field(root: string, ...keys: string[]) {
      let value = objects.get(root);
      for (const key of keys) {
        if (value && ts.isAsExpression(value)) value = value.expression;
        if (!value || !ts.isObjectLiteralExpression(value)) return undefined;
        const prop: ts.ObjectLiteralElementLike | undefined = value.properties.find(p => p.name?.getText() === key);
        value = prop && ts.isPropertyAssignment(prop) ? prop.initializer : undefined;
      }
      return value?.getText();
    }
    function number(value: string | undefined) {
      if (value === undefined || !Number.isFinite(Number(value))) throw new Error('Invalid UserBench result');
      return Number(value);
    }
    const rows: LeaderboardRow[] = [];
    for (const ds of [false, true]) {
      for (const arm of ['baseline', 'train400']) {
        for (const effort of ['low', 'high', 'max']) {
          if (!ds && arm === 'baseline' && effort === 'max') continue;
          const path = ds ? ['DS_FLASH', arm, effort] : [effort === 'high' ? 'ML' : 'ML_' + effort.toUpperCase(), arm];
          const get = (key: string) => field(path[0], ...path.slice(1), key);
          const model = ds ? JSON.parse(field('DS_FLASH', 'model')!) as string : 'GPT-5.6 Sol';
          const row: LeaderboardRow = { model, setting: arm + ' / ' + effort, score: 100 * number(get('jaccard')),
            trials: effort === 'high' ? 3 : 1, metrics: {} };
          for (const key of ['exact', 'chance', 'exactChance', 'macroF1', 'cacheHit']) {
            if (get(key) !== undefined) row.metrics![key] = 100 * number(get(key));
          }
          const interval = get('ci');
          if (interval) {
            const bounds = JSON.parse(interval.replace(/ as const$/, '')) as number[];
            row.low = 100 * number(String(bounds[0]));
            row.high = 100 * number(String(bounds[1]));
          }
          const link = ds ? field('DS_HUB', arm + effort[0].toUpperCase() + effort.slice(1))
            : field('HUB_URLS', effort === 'high' ? 'agentTraces' : 'agentTracesLow', arm);
          if (ds || effort !== 'max') row.link = JSON.parse(link!) as string;
          rows.push(row);
        }
      }
    }
    return rows;
  },
};
export default board;
