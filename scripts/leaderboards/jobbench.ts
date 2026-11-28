// JobBench on job-bench.github.io. The site is a static Next.js export whose results section is a heatmap
// table: one column per model, one row per occupation. Each column header carries a title attribute such as
// "Claude Fable 5 · OpenCode · overall 57.4", which names the model, the agent it ran in and its overall
// score (mean over the 130 tasks, 0 to 100). That title is the headline read here.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const URL = 'https://job-bench.github.io/';

const OCCUPATIONS: Record<string, string> = {
  'Bookkeeping Accounting And Auditing Clerks': 'Bookkeeping and Accounting Clerks',
  'Human Resources Specialists': 'HR Specialists',
  'Licensing Examiners And Inspectors': 'Licensing Examiners and Inspectors',
  'Management Analysts': 'Management Analysts',
  'Personal Financial Advisors': 'Personal Financial Advisors',
  'Purchasing Agents Except Wholesale Retail And Farm Products': 'Purchasing Agents',
  'Training And Development Specialists': 'Training and Development Specialists',
  'Court Clerks': 'Court Clerks',
  'Customer Service Representatives': 'Customer Service Reps',
  'Data Entry Keyers': 'Data Entry Keyers',
  'Medical Secretaries': 'Medical Secretaries',
  'Police Fire And Ambulance Dispatchers': 'Police and Fire Dispatchers',
  'Secretaries And Administrative Assistants Except Legal Medical And Executive': 'Secretaries and Admin Assistants',
  Biostatisticians: 'Biostatisticians',
  'Computer And Information Research Scientists': 'CS Researchers',
  Statisticians: 'Statisticians',
  'Computer User Support Specialists': 'User Support Specialists',
  'Web Administrators': 'Web Administrators',
  'Civil Engineers': 'Civil Engineers',
  'Mechanical Engineering Technicians': 'Mechanical Eng. Technicians',
  'Mechanical Engineers': 'Mechanical Engineers',
  'Petroleum Engineers': 'Petroleum Engineers',
  'Financial Managers Branch Or Department': 'Financial Managers',
  'Medical And Health Services Managers': 'Health Services Managers',
  'Computer And Information Systems Managers': 'IT and IS Managers',
  'Supply Chain Managers': 'Supply Chain Managers',
  Producers: 'Producers',
  'Reporters And Correspondents': 'Reporters and Correspondents',
  'Technical Writers': 'Technical Writers',
  Lawyers: 'Lawyers',
  'Online Merchants': 'Online Merchants',
  'Sales Agents Securities And Commodities': 'Securities Sales Agents',
  'Social Science Research Assistants': 'Soc. Sci. Research Assistants',
  'Sociology Teachers Postsecondary': 'Sociology Teachers (Postsec.)',
  'Sales Representatives Wholesale And Manufacturing Technical And Scientific Products': 'Tech and Sci. Sales Reps',
};

const board: Leaderboard = {
  benchmark: 'jobbench',
  parts: Object.fromEntries(Object.entries(OCCUPATIONS).map(([k, name]) => [k, { name, group: 'Occupation' }])),
  url: URL,
  feed: `${URL} (column header titles of the results heatmap)`,
  terms: 'Static GitHub Pages site with no robots.txt and no terms; the evaluation code is public at github.com/Job-Bench/job-bench-eval.',
  aliases: {},
  async fetch() {
    const html = await fetchText(URL);
    const rows: LeaderboardRow[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(/<th\b[^>]*\btitle="([^"]+?) · ([^"]+?) · overall (\d+(?:\.\d+)?)"/g)) {
      const model = text(m[1]);
      const harness = text(m[2]);
      if (seen.has(`${model}|${harness}`)) continue;
      seen.add(`${model}|${harness}`);
      rows.push({ model, harness, score: Number(m[3]),
        ...(model === 'Claude Fable 5' && /fallback to Claude Opus 4\.8 on refusals/.test(html)
          ? { setting: 'Claude Opus 4.8 fallback on refusals' } : {}),
      });
    }
    const table = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/)?.[0] ?? '';
    for (const tr of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...tr[1].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g)];
      if (cells.length !== rows.length + 1) continue;
      for (const [i, cell] of cells.slice(1).entries()) {
        const match = cell[1].match(/title="([^"]+?) → ([^"]+): ([\d.]+)%"/);
        if (!match || text(match[1]) !== rows[i].model) continue;
        const occupation = text(match[2]);
        (rows[i].metrics ??= {})[occupation] = Number(match[3]);
      }
    }
    if (!rows.length) throw new Error('no overall scores in the JobBench heatmap headers');
    return rows;
  },
};
export default board;
