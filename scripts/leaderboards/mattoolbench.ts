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
  stats: {
    avantageSR: { name: 'Avantage success rate', unit: '%', better: 'higher' }, avantageSteps: { name: 'Avantage steps', unit: 'count', better: 'lower' }, avantageStepsStar: { name: 'Avantage starred steps', unit: 'count', better: 'lower' }, avantageFTR: { name: 'Avantage first try rate', unit: '%', better: 'higher' },
    jadeSR: { name: 'Jade success rate', unit: '%', better: 'higher' }, jadeSteps: { name: 'Jade steps', unit: 'count', better: 'lower' }, jadeStepsStar: { name: 'Jade starred steps', unit: 'count', better: 'lower' }, jadeFTR: { name: 'Jade first try rate', unit: '%', better: 'higher' },
    dmSR: { name: 'Digital Micrograph success rate', unit: '%', better: 'higher' }, dmSteps: { name: 'Digital Micrograph steps', unit: 'count', better: 'lower' }, dmStepsStar: { name: 'Digital Micrograph starred steps', unit: 'count', better: 'lower' }, dmFTR: { name: 'Digital Micrograph first try rate', unit: '%', better: 'higher' },
    msSR: { name: 'Materials Studio success rate', unit: '%', better: 'higher' }, msSteps: { name: 'Materials Studio steps', unit: 'count', better: 'lower' }, msStepsStar: { name: 'Materials Studio starred steps', unit: 'count', better: 'lower' }, msFTR: { name: 'Materials Studio first try rate', unit: '%', better: 'higher' },
    vestaSR: { name: 'VESTA software success rate', unit: '%', better: 'higher' }, vestaSteps: { name: 'VESTA software steps', unit: 'count', better: 'lower' }, vestaStepsStar: { name: 'VESTA software starred steps', unit: 'count', better: 'lower' }, vestaFTR: { name: 'VESTA software first try rate', unit: '%', better: 'higher' },
    guiavgSR: { name: 'GUI average success rate', unit: '%', better: 'higher' }, guiavgSteps: { name: 'GUI average steps', unit: 'count', better: 'lower' }, guiavgStepsStar: { name: 'GUI average starred steps', unit: 'count', better: 'lower' }, guiavgFTR: { name: 'GUI average first try rate', unit: '%', better: 'higher' },
    originSR: { name: 'Origin success rate', unit: '%', better: 'higher' }, originSteps: { name: 'Origin steps', unit: 'count', better: 'lower' }, originStepsStar: { name: 'Origin starred steps', unit: 'count', better: 'lower' }, originFTR: { name: 'Origin first try rate', unit: '%', better: 'higher' },
    pymatgenSR: { name: 'Pymatgen success rate', unit: '%', better: 'higher' }, pymatgenSteps: { name: 'Pymatgen steps', unit: 'count', better: 'lower' }, pymatgenStepsStar: { name: 'Pymatgen starred steps', unit: 'count', better: 'lower' }, pymatgenFTR: { name: 'Pymatgen first try rate', unit: '%', better: 'higher' },
    mpSR: { name: 'Materials Project success rate', unit: '%', better: 'higher' }, mpSteps: { name: 'Materials Project steps', unit: 'count', better: 'lower' }, mpStepsStar: { name: 'Materials Project starred steps', unit: 'count', better: 'lower' }, mpFTR: { name: 'Materials Project first try rate', unit: '%', better: 'higher' },
    oqmdSR: { name: 'Open Quantum Materials Database success rate', unit: '%', better: 'higher' }, oqmdSteps: { name: 'Open Quantum Materials Database steps', unit: 'count', better: 'lower' }, oqmdStepsStar: { name: 'Open Quantum Materials Database starred steps', unit: 'count', better: 'lower' }, oqmdFTR: { name: 'Open Quantum Materials Database first try rate', unit: '%', better: 'higher' },
    optimadeSR: { name: 'OPTIMADE database success rate', unit: '%', better: 'higher' }, optimadeSteps: { name: 'OPTIMADE database steps', unit: 'count', better: 'lower' }, optimadeStepsStar: { name: 'OPTIMADE database starred steps', unit: 'count', better: 'lower' }, optimadeFTR: { name: 'OPTIMADE database first try rate', unit: '%', better: 'higher' },
    codeavgSR: { name: 'Code average success rate', unit: '%', better: 'higher' }, codeavgSteps: { name: 'Code average steps', unit: 'count', better: 'lower' }, codeavgStepsStar: { name: 'Code average starred steps', unit: 'count', better: 'lower' }, codeavgFTR: { name: 'Code average first try rate', unit: '%', better: 'higher' },
    SR: { name: 'Success rate', unit: '%', better: 'higher' }, Steps: { name: 'Overall steps', unit: 'count', better: 'lower' }, StepsStar: { name: 'Starred steps', unit: 'count', better: 'lower' }, FTR: { name: 'First try rate', unit: '%', better: 'higher' },
  },
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
