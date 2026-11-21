// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// CoSE-E tests speech recognition on code-switched enterprise conversations. Table 2 reports answer error rate for each language pair.
// The other metrics measure transcription errors and remain separate from the headline.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2026.salma-1.11.pdf';
const pairs = ['ES/EN','FR/EN','FR-CA/EN','DE/EN','ZH/EN'];
const parts: Record<string,BoardPart> = {};
const board: Leaderboard = {
  benchmark:'cose-e', url:'https://aclanthology.org/2026.salma-1.11/', feed, static:'paper', parts,
  headline:'The paper gives no overall score, so this is the plain mean of answer error rates across five language pairs.',
  terms:'ACL Anthology distributes the authors’ paper under its publication terms. https://aclanthology.org/faq/copyright/',
  aliases:{Whisper:'whisper-large-v3-turbo','Gemini-3-Flash':'gemini-3-flash','Qwen3-Omni':'qwen3-omni-30b-a3b'},
  async fetch() {
    const pdf = await pdfText(feed);
    const end = pdf.indexOf('Table 2: WER, SWER, and AER');
    const page = pdf.slice(pdf.lastIndexOf('\f',end),end);
    if (end < 0 || !pairs.every(p=>page.includes(p)) || !/WER\s+CER\s+SWER\s+AER/.test(page)) throw new Error('Missing Table 2 columns');
    const rows: LeaderboardRow[] = [];
    for (const line of page.trim().split('\n').slice(2)) {
      if (!line.trim()) continue;
      const [model,...cells] = line.trim().split(/\s+/);
      if (cells.length !== 16) throw new Error('Unexpected row for ' + model);
      if (cells.includes('–')) continue;
      let offset = 0;
      let sum = 0;
      const metrics: Record<string,number> = {};
      for (const p of pairs) {
        for (const measure of p === 'ZH/EN' ? ['WER','CER','SWER','AER'] : ['WER','SWER','AER']) {
          const key = p.replace(/[^A-Z]/g,'') + measure;
          const s = cells[offset++];
          if (!/^\d*\.\d+$/.test(s)) throw new Error('Invalid ' + key);
          metrics[key] = Number(s) * 100;
          parts[key] = {name:p + ' ' + measure, group:measure, better:'lower', unit:'%'};
          if (measure === 'AER') sum += metrics[key];
        }
      }
      rows.push({model,score:sum / pairs.length,metrics});
    }
    return checked(rows,5);
  },
};
export default board;
