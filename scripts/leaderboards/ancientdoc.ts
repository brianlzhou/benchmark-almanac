// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// AncientDoc tests transcription, translation and question answering on historical Chinese documents.
// Tables 8 to 12 report GPT-4o judge scores from 0 to 10 on every task. Tables 2 to 6 add two Qwen3 models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2026.findings-acl.1438.pdf';
const parts = { ocr: 'Page-level OCR', translation: 'Vernacular Translation', reasoning: 'Reasoning-based QA', knowledge: 'Knowledge-based QA', variant: 'Linguistic Variant QA' };
const board: Leaderboard = {
  benchmark: 'ancientdoc', url: 'https://bytedance.github.io/AncientDoc/#results', feed, parts,
  terms: 'The ACL Anthology publishes the paper under its copyright policy at https://aclanthology.org/faq/copyright/.',
  async fetch() {
    const pdf = await pdfText(feed);
    const main = pdf.split('Table 2: Evaluation on page-level OCR.');
    const appendix = pdf.split('Table 8: Evaluation Results on Page-level OCR of AncientDoc')[1];
    if (main.length !== 2 || !appendix?.includes('CharPrecision') || !appendix.includes('CHRF++')) throw new Error('Missing AncientDoc results tables');
    const metricsByModel = new Map<string, Record<string, number>>();
    function metrics(model: string) {
      if (!metricsByModel.has(model)) metricsByModel.set(model, {});
      return metricsByModel.get(model)!;
    }
    for (const line of appendix.split('Table 9:')[0].split('\n').concat(main[0].split('\n').filter(line => /Qwen3-VL-\d+B \(2025a\)/.test(line)))) {
      const cells = line.replace(/\s+\(2025a\)/, '').trim().split(/\s+/);
      if (cells.length !== 6 || !cells.slice(1).every(x => /^\d+(?:\.\d+)?$/.test(x))) continue;
      const [cer, precision, recall, f1, ocr] = cells.slice(1).map(Number);
      Object.assign(metrics(cells[0]), { cer, precision, recall, f1, ocr });
    }
    const qa = appendix.split('Table 9:')[1]?.split('Table 10:');
    if (qa?.length !== 2 || !qa[0].includes('Table 11:') || !qa[1].includes('Table 12:')) throw new Error('Missing paired QA tables');
    for (const [i, pair] of qa.entries()) {
      for (const line of pair.split('\n')) {
        const cells = line.trim().split(/\s+/);
        if (cells.length !== 8 || ![1,2,3,5,6,7].every(j => /^\d+(?:\.\d+)?$/.test(cells[j]))) continue;
        for (const [j, key] of (i === 0 ? ['reasoning','knowledge'] : ['translation','variant']).entries()) {
          const offset = j * 4;
          Object.assign(metrics(cells[offset]), { [key + 'ChrF']: +cells[offset+1], [key+'BsF1']: +cells[offset+2], [key]: +cells[offset+3] });
        }
      }
    }
    const body = main[1].split('Table 3: Evaluation on vernacular translation.');
    const last = body[1]?.split('Table 4: Evaluation on reasoning-based QA.');
    if (!last?.[1].includes('Table 6: Evaluation on linguistic variant QA.')) throw new Error('Missing main QA tables');
    for (const [key, section] of [['translation',body[0]],['reasoning',last[0]],['knowledge',last[1].split('Table 5: Evaluation')[0]]]) {
      for (const line of section.split('\n')) {
        const pairs = [...line.matchAll(/(Qwen3-VL-(?:4|8)B)\s+([\d.]+)\s+([\d.]+)/g)];
        pairs.forEach(([_, model, judge, f1], i) => {
          const task = i === 1 ? 'variant' : key;
          Object.assign(metrics(model), { [task]: +judge, [task+'BsF1']: +f1 });
        });
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of metricsByModel) {
      const scores = Object.keys(parts).map(key => metrics[key]);
      if (scores.every(Number.isFinite)) rows.push({model, metrics, score: Number((scores.reduce((a,b)=>a+b)/5).toFixed(4))});
    }
    return checked(rows, 26);
  },
};
export default board;
