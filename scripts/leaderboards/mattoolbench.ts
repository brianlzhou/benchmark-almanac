// MatToolBench tests agents on materials software. The default Score tab reports normalized partial credit.
// The page renders model columns from two inline arrays for accuracy and efficiency.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const url = 'https://mattoolbench.github.io/';
type Domain = { domain_en: string; tools?: string; isOverall?: boolean; values: (number | null)[][] };

function domains(html: string, name: string) {
  const start = html.indexOf('const ' + name + ' = [');
  if (start < 0) throw new Error('Missing ' + name);
  const source = html.slice(html.indexOf('[', start)).replace(/'([^'\n]*)'/g, (_, label: string) => JSON.stringify(label)).replace(/\bNaN\b/g, 'null');
  return jsLiteral<Domain[]>(source, 0);
}

const board: Leaderboard = {
  benchmark: 'mattoolbench', url: url + '#leaderboard', feed: url,
  terms: 'The project page names the MIT License.',
  aliases: { 'doubao-seed-1-8': 'seed-1-8' },
  async fetch() {
    const html = await fetchText(url);
    const names = html.match(/function renderAcc\([^)]*\)[\s\S]*?const MODELS = \[([^\]]+)\]/)?.[1];
    const models = [...(names ?? '').matchAll(/'([^']+)'/g)].map(m => m[1]);
    const accuracy = domains(html, 'ACC_DATA');
    const efficiency = domains(html, 'EFF_DATA');
    const overall = accuracy.find(d => d.isOverall);
    if (models.length < 7 || !overall || accuracy.length < 13 || efficiency.length !== accuracy.length) throw new Error('Incomplete MatToolBench tables');
    const parts: Record<string, string> = {};
    board.parts = parts;
    return models.map((model, i) => {
      const metrics: Record<string, number> = {};
      for (const [index, d] of accuracy.entries()) {
        const eff = efficiency[index];
        if (eff.domain_en !== d.domain_en || eff.tools !== d.tools || d.values.length !== models.length || eff.values.length !== models.length) throw new Error('Misaligned domain ' + d.domain_en);
        const label = d.domain_en === 'Avg.' ? d.tools + ' Avg.' : d.domain_en;
        const key = d.isOverall ? '' : label.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const [score, sr] = d.values[i];
        if (d.values[i].length !== 2 || eff.values[i].length !== 3) throw new Error('Missing values for ' + label);
        if (key && score !== null) { parts[key] = label; metrics[key] = score; }
        for (const [j, value] of [sr, ...eff.values[i]].entries()) {
          if (value !== null) metrics[key + ['SR', 'Steps', 'StepsStar', 'FTR'][j]] = value;
        }
      }
      const score = overall.values[i][0];
      if (score === null || !Number.isFinite(score)) throw new Error('Missing Score for ' + model);
      return { model, score, metrics };
    });
  },
};
export default board;
