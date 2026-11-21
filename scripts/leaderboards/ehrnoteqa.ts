// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// EHRNoteQA tests question answering over hospital discharge summaries. Table 4 reports
// the percentage correct at two context lengths for multiple-choice and open-ended answers.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://proceedings.neurips.cc/paper_files/paper/2024/file/e15c4afff22f12c4986c1fcb4e941e03-Paper-Datasets_and_Benchmarks_Track.pdf';
const board: Leaderboard = {
  benchmark: 'ehrnoteqa', url: feed, feed, static: 'paper',
  terms: 'The NeurIPS proceedings publish the paper under CC BY 4.0. https://proceedings.neurips.cc/',
  headline: 'Table 4 reports no overall score, so this is the plain mean of Level 1 and Level 2 accuracy.',
  parts: {level1:'Level 1', level2:'Level 2'},
  aliases: {'GPT4 (0613)':'gpt-4-jun-2023','GPT4-Turbo (1106)':'gpt-4-turbo-nov-2023','Mistral-7b-Instruct':'mistral-7b-instruct-v0-2'},
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 4: Results of 27 LLMs')[1]?.split('Impact of Note Length')[0];
    if (!table || !/Multi-Choice\s+Open-Ended/.test(table) || !/Level 1\s+Level 2\s+Level 1\s+Level 2/.test(table)) throw new Error('Missing EHRNoteQA levels');
    const rows: LeaderboardRow[] = [];
    const models = [...table.matchAll(/^\s*(?:(?:70B|30B|8x7B|13B|7B)[ \t]+)?([\w.-]+)[ \t]+([\d.]+|−)[ \t]+([\d.]+|−)[ \t]+([\d.]+|−)[ \t]+([\d.]+|−)[ \t]+(?:\S+[ \t]+)?\[\d+\]/gm)];
    if (models.length !== 27) throw new Error('Expected 27 model rows');
    for (const [,label,mc1,mc2,open1,open2] of models) {
      const versions: Record<string,string> = {'GPT4':'GPT4 (0613)', 'GPT4-Turbo':'GPT4-Turbo (1106)', 'GPT3.5-Turbo':'GPT3.5-Turbo-16k (0613)'};
      const model = versions[label] || label;
      for (const [setting,a,b] of [['Multiple choice',mc1,mc2],['Open-ended',open1,open2]]) {
        if (a === '−' || b === '−') continue;
        const level1 = Number(a), level2 = Number(b);
        rows.push({model,setting,score:(level1+level2)/2,trials:962,metrics:{level1,level2}});
      }
    }
    return checked(rows, 18);
  },
};
export default board;
