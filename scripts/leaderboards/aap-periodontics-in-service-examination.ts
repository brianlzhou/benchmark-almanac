// AAP Periodontics In-Service Examination evaluates large language models on 1,312 selected
// American Academy of Periodontology in-service exam questions spanning 2020 through 2023.
// This importer reads Table 2 of Sabri et al. (PMC11873669) via the open-access Europe PMC
// REST API, capturing overall accuracy, exam year splits, ten subject sections, difficult
// questions, and total correct answers while excluding human resident rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11873669/fullTextXML';

const SECTIONS: ReadonlyArray<readonly [string, RegExp, string]> = [
  ['embryologyAnatomy', /^Embryology and Anatomy$/i, 'Embryology and anatomy'],
  ['biostatistics', /^Biostatistics/i, 'Biostatistics and experimental design'],
  ['biochemistryPhysiology', /^Biochemistry/i, 'Biochemistry and physiology'],
  ['microbiologyImmunology', /^Microbiology and Immunology$/i, 'Microbiology and immunology'],
  ['periodontalEtiology', /^Periodontal Etiology/i, 'Periodontal etiology and pathology'],
  ['pharmacology', /^Pharmacology and Therapeutics$/i, 'Pharmacology and therapeutics'],
  ['diagnosis', /^Diagnosis$/i, 'Diagnosis'],
  ['treatmentPlanning', /^Treatment Planning/i, 'Treatment planning and prognosis'],
  ['therapy', /^Therapy$/i, 'Therapy'],
  ['oralPathology', /^Oral Pathology/i, 'Oral pathology and oral medicine'],
];

function stripXml(s: string): string {
  return s
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCountPct(cell: string): { count: number; pct: number } {
  // Formats in Table 2: "260 (70.65)", "956 (72.86%)", "(290) 78.80%", "(241)79.80", "80 (83.33%)"
  const parenCount = cell.match(/^\((\d+)\)\s*(\d+(?:\.\d+)?)%?$/);
  if (parenCount) return { count: Number(parenCount[1]), pct: Number(parenCount[2]) };
  const parenPct = cell.match(/^(\d+)\s*\((\d+(?:\.\d+)?)%?\)$/);
  if (parenPct) return { count: Number(parenPct[1]), pct: Number(parenPct[2]) };
  throw new Error(`AAP Periodontics unexpected score cell: "${cell}"`);
}

const board: Leaderboard = {
  benchmark: 'aap-periodontics-in-service-examination',
  static: 'paper',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11873669/',
  feed: FEED,
  terms: 'Open-access Europe PMC full-text XML (CC BY). Scores remain attributed to Sabri et al.',
  headline: 'Headline is overall accuracy in percent across 1,312 selected 2020 to 2023 exam questions from Table 2.',
  parts: {
    year2020: { name: '2020 exam', group: 'Exam year', unit: '%', better: 'higher' },
    year2021: { name: '2021 exam', group: 'Exam year', unit: '%', better: 'higher' },
    year2022: { name: '2022 exam', group: 'Exam year', unit: '%', better: 'higher' },
    year2023: { name: '2023 exam', group: 'Exam year', unit: '%', better: 'higher' },
    ...Object.fromEntries(SECTIONS.map(([key, , name]) => [key, { name, group: 'Exam section', unit: '%' as const, better: 'higher' as const }])),
    difficultQuestions: { name: 'Difficult questions (127 items)', group: 'Subset', unit: '%', better: 'higher' },
  },
  stats: {
    correct: { name: 'Correct answers', unit: 'count', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, {
      headers: { 'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Europe PMC fetch failed: ${res.status}`);
    const xml = await res.text();
    const wraps = xml.match(/<table-wrap[\s\S]*?<\/table-wrap>/gi) ?? [];
    const t2 = wraps.find((w) => /Google Gemini/i.test(w) && /Difficult Questions/i.test(w));
    if (!t2) throw new Error('AAP Periodontics Table 2 missing in PMC11873669 XML');

    const rowsRaw = (t2.match(/<tr[\s\S]*?<\/tr>/gi) ?? []).map((tr) =>
      [...tr.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => stripXml(m[1]))
    );

    const byKey: Record<'gpt4' | 'gemini' | 'gpt35', LeaderboardRow> = {
      gpt4: { model: 'GPT-4 (snapshot unspecified)', score: NaN, metrics: {} },
      gemini: { model: 'Google Gemini (snapshot unspecified)', score: NaN, metrics: {} },
      gpt35: { model: 'GPT-3.5 (snapshot unspecified)', score: NaN, metrics: {} },
    };

    const years = ['year2020', 'year2021', 'year2022', 'year2023'] as const;
    let inDifficult = false;

    for (const cells of rowsRaw) {
      const label = cells[0] ?? '';
      if (!label) continue;
      if (/^Difficult Questions$/i.test(label)) {
        inDifficult = true;
        continue;
      }

      if (!inDifficult && cells.length >= 6) {
        let key: 'gpt4' | 'gemini' | 'gpt35' | null = null;
        if (/^GPT-4$/i.test(label)) key = 'gpt4';
        else if (/^Google Gemini$/i.test(label)) key = 'gemini';
        else if (/^GPT-3\.5$/i.test(label)) key = 'gpt35';
        if (key) {
          for (let i = 0; i < 4; i++) {
            byKey[key].metrics![years[i]] = parseCountPct(cells[i + 1]).pct;
          }
          const overall = parseCountPct(cells[5]);
          byKey[key].score = overall.pct;
          byKey[key].metrics!.correct = overall.count;
          continue;
        }
      }

      if (!inDifficult && cells.length >= 4) {
        const sec = SECTIONS.find(([, re]) => re.test(label));
        if (sec) {
          byKey.gpt4.metrics![sec[0]] = parseCountPct(cells[1]).pct;
          byKey.gemini.metrics![sec[0]] = parseCountPct(cells[2]).pct;
          byKey.gpt35.metrics![sec[0]] = parseCountPct(cells[3]).pct;
          continue;
        }
      }

      if (inDifficult && cells.length >= 4) {
        const pct = Number(cells[3].replace(/%/g, '').trim());
        if (!Number.isFinite(pct)) continue;
        if (/^GPT-4$/i.test(label)) byKey.gpt4.metrics!.difficultQuestions = pct;
        else if (/^Gemini$/i.test(label)) byKey.gemini.metrics!.difficultQuestions = pct;
        else if (/^GPT-3\.5$/i.test(label)) byKey.gpt35.metrics!.difficultQuestions = pct;
      }
    }

    const out = [byKey.gpt4, byKey.gemini, byKey.gpt35];
    for (const r of out) {
      if (!Number.isFinite(r.score)) throw new Error(`AAP Periodontics missing overall score for ${r.model}`);
    }
    return checked(out, 3);
  },
};

export default board;
