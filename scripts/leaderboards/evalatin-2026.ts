// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// EvaLatin's parsing board ranks poetry and prose separately by content-word labeled attachment F1 with relation subtypes.
// Tables 2 to 4 give three other scoring conventions for the same runs. The NER competition has separate submissions.
// Model identities come from the organizers' overview and the THIVLVC, UppsalaNLP and Omnes Flores system papers.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/CIRCSE/LT4HALA/master/2026/data_and_doc/EvaLatin_2026_Ranking_DEP.pdf';
const systems: Record<string, string> = { THIVLVC: 'gemini-3-flash', UppsalaNLP: 'XLM-RoBERTa Large', OmnesFlores: 'omnes flores', BASELINE: 'UDPipe 2' };
const board: Leaderboard = {
  benchmark: 'evalatin-2026', url: 'https://circse.github.io/LT4HALA/2026/EvaLatin.html', feed,
  terms: 'The organizers publicly distribute the official ranking in the shared task repository. https://github.com/CIRCSE/LT4HALA/tree/master/2026/data_and_doc',
  stats: {
    poetryCLASWithoutSubtypes: { name: 'Poetry complete labeled attachment score without subtypes', unit: '%', better: 'higher' },
    poetryLASWithSubtypes: { name: 'Poetry labeled attachment score with subtypes', unit: '%', better: 'higher' },
    poetryLASWithoutSubtypes: { name: 'Poetry labeled attachment score without subtypes', unit: '%', better: 'higher' },
    proseCLASWithoutSubtypes: { name: 'Prose complete labeled attachment score without subtypes', unit: '%', better: 'higher' },
    proseLASWithSubtypes: { name: 'Prose labeled attachment score with subtypes', unit: '%', better: 'higher' },
    proseLASWithoutSubtypes: { name: 'Prose labeled attachment score without subtypes', unit: '%', better: 'higher' },
  },
  parts: { poetry: 'Poetry', prose: 'Prose' },
  async fetch() {
    const pdf = await pdfText(feed);
    const metricsByRun = new Map<string, Record<string, number>>();
    const tables = [...pdf.matchAll(/TEAM\s+F1 POETRY\s+TEAM\s+F1 PROSE([\s\S]*?)Table (\d+): Dependency Parsing results in terms of (CLAS|LAS) (with|without) subtypes\./g)];
    if (tables.length !== 4) throw new Error('EvaLatin ranking tables changed');
    for (const [, body, number, metric, subtypes] of tables) {
      const suffix = number === '1' ? '' : metric + (subtypes === 'with' ? 'WithSubtypes' : 'WithoutSubtypes');
      for (const line of body.trim().split('\n')) {
        const m = line.match(/^\s*(.+?)\s+(\d+\.\d+)\s+(.+?)\s+(\d+\.\d+)\s*$/);
        if (!m) throw new Error('Invalid poetry or prose result');
        for (const [run, key, score] of [[m[1], 'poetry', m[2]], [m[3], 'prose', m[4]]]) {
          const id = run.replace('Omnes Flores', 'OmnesFlores');
          const metrics = metricsByRun.get(id) ?? {};
          metrics[key + suffix] = Number(score);
          metricsByRun.set(id, metrics);
        }
      }
    }
    return checked([...metricsByRun].map(([run, metrics]) => {
      const [team, version] = run.split('_');
      const model = systems[team];
      if (!model || Object.keys(metrics).length !== 8) throw new Error('Incomplete EvaLatin run ' + run);
      return { model, submitter: team === 'BASELINE' ? 'EvaLatin' : team,
        setting: version ? team + ' run ' + version : 'Baseline', metrics, score: (metrics.poetry + metrics.prose) / 2 };
    }), 7);
  },
};
export default board;
