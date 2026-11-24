// PolEval Task 2b ranks Polish and English translation systems. The official medal list gives
// headline scores by submitter. Tables 3 and 5 of the task paper identify systems and break down results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = "https://poleval.pl/2025/results/";
const GROUPS = ['PL→EN, PL prompt', 'PL→EN, EN prompt', 'EN→PL, PL prompt', 'EN→PL, EN prompt'];
const METRICS = ['BLEU', 'chrF', 'chrF++'];
const PART_KEYS = GROUPS.flatMap(group => METRICS.map(metric => group + ', ' + metric));
const board: Leaderboard = {
  benchmark: 'poleval-2025-gender-sensitive-translation',
  url: "https://poleval.pl/2025/results/",
  feed,
  static: 'paper',
  parts: Object.fromEntries(GROUPS.flatMap(group => METRICS.map(metric => [group + ', ' + metric, { name: metric, group, unit: 'score' as const }]))),
  terms: "PolEval robots.txt disallows /data/ and permits the results page. The organizers give no separate reuse license for the results.",
  async fetch() {
    const html = await fetchText(feed);
    const section = html.split('Task 2b:')[1]?.split('</ol>')[0];
    if (!section?.includes('Translation')) throw new Error('Missing translation results');
    const paperUrl = 'https://aclanthology.org/2025.poleval-main.6.pdf';
    const table = (await pdfText(paperUrl)).split('Table 5: Results for')[1];
    if (!table?.includes('chrF++')) throw new Error('Missing translation breakdown');
    const systems: Record<string, string> = { kwrobel: 'KW', 'adam.majczyk': 'AM', mczajka: 'MC' };
    const rows: LeaderboardRow[] = [];
    for (const match of section.matchAll(/<li>([^<]+?) \(([\d.]+)\)<\/li>/g)) {
      const submitter = match[1], code = systems[submitter];
      if (!code) throw new Error('Unidentified translation system: ' + submitter);
      const line = table.split('\n').find(l => l.trimStart().startsWith(code + '- B '));
      const values = line?.trim().split(/\s+/).slice(2).map(Number);
      if (values?.length !== 12 || !values.every(Number.isFinite)) throw new Error('Missing translation metrics');
      rows.push({ model: code + '-B', score: Number(match[2]), submitter, link: paperUrl,
        metrics: Object.fromEntries(PART_KEYS.map((key, i) => [key, values[i]])) });
    }
    if (rows.length !== 3) throw new Error('Missing PolEval translation medalists');
    return rows;
  },
};
export default board;
