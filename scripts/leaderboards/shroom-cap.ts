// The source reports no overall score. The headline is the plain mean of the 18 parts, computed by this importer.
// SHROOM-CAP measures factuality and fluency error detection in nine languages by macro F1.
// Tables 6 and 7 give post-evaluation scores. Section 7 and Table 2 identify the entrants' models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2025.chomps-main.7.pdf';
const languages = ['EN', 'ES', 'FR', 'HI', 'IT', 'BN', 'GU', 'ML', 'TE'];
const entries = [
  { team: 'CUET_GOODFELLAS', printed: 'CUET-G OODFELLAS', model: 'GPT-oss-20B', setting: 'Zero-shot' },
  { team: 'AGI', printed: 'AGI', model: 'XLM-RoBERTa-Large', setting: 'Fine-tuned' },
  { team: 'Organizers', printed: 'baseline (SelfCheck)', model: 'google/gemma-2-9b', setting: 'SelfCheckGemma' },
];
const board: Leaderboard = {
  benchmark: 'shroom-cap', url: 'https://aclanthology.org/2025.chomps-main.7/', feed, static: 'paper',
  terms: 'ACL Anthology distributes this paper under CC BY 4.0. https://aclanthology.org/faq/copyright/',
  headline: 'The paper reports no overall score, so the headline is the plain mean of factuality and fluency macro F1 across nine languages.',
  parts: Object.fromEntries(['Factuality', 'Fluency'].flatMap(task => languages.map(l => [task + l, { name: l, group: task }]))),
  async fetch() {
    const pages = (await pdfText(feed)).split('\f');
    const page = pages.find(p => p.includes('Table 6: Official post-evaluation rankings'));
    const fluency = pages.find(p => p.includes('Table 7: Official post-evaluation rankings'));
    if (!page || !fluency) throw new Error('Missing post-evaluation tables');
    // Table 6 starts low in the left column and continues at the top of the right column.
    const boundary = page.split('\n').find(l => /Language\s+Rank\s+Team\s+Factuality/.test(l))!.indexOf('Language');
    const lines = page.split('\n');
    const left = lines.map(l => l.slice(0, boundary)).join('\n').split('Post-Evaluation Leaderboard')[1];
    const right = lines.map(l => l.slice(boundary)).join('\n');
    if (!left || !right.includes('Factuality') || !fluency.includes('Fluency')) throw new Error('Changed table layout');
    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      const metrics: Record<string, number> = {};
      for (const [name, table] of [['Factuality', left + '\n' + right], ['Fluency', fluency]]) {
        for (const match of table.matchAll(/\b(EN|ES|FR|HI|IT|BN|GU|ML|TE)\s+\d+\s+([A-Za-z ()_-]+?)\s+(0\.\d+)\b/g)) {
          if (match[2].trim() === e.printed) metrics[name + match[1]] = Number(match[3]);
        }
      }
      if (Object.keys(metrics).length !== 18) throw new Error('Incomplete published row for ' + e.team);
      rows.push({ model: e.model, submitter: e.team, setting: 'Post-evaluation, ' + e.setting, metrics,
        score: Object.values(metrics).reduce((a, b) => a + b) / 18 });
    }
    return checked(rows, 3);
  },
};
export default board;
