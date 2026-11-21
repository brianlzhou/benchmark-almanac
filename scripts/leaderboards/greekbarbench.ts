// GreekBarBench tests legal reasoning and statutory citations on the Greek bar examination.
// Table 5 reports a mean grade out of ten with standard error across three Span-Judge runs.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2025.findings-emnlp.1368.pdf';
const board: Leaderboard = {
  benchmark: 'greekbarbench', static: 'paper', feed, url: 'https://aclanthology.org/2025.findings-emnlp.1368/',
  terms: 'ACL Anthology copyright and licensing: https://aclanthology.org/faq/copyright/',
  aliases: { 'OpenAI-o1': 'o1', 'Claude-3.7-S.': 'claude-3-7-sonnet' },
  parts: { facts:'Facts', articles:'Articles', analysis:'Analysis' },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Model\s+Facts\s+Articles\s+Analysis\s+Mean\b([\s\S]*?)Table 5: Comparison of closed/);
    if (!table) throw Error('Missing Table 5 mean grades');
    const rows = [];
    for (const line of table[1].split('\n')) {
      const match = /^\s*(\S+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*±\s*([\d.]+)/.exec(line);
      if (!match) continue;
      const [,model,facts,articles,analysis,mean,error] = match;
      rows.push({model, score:Number(mean), trials:3, metrics:{ facts:Number(facts), articles:Number(articles), analysis:Number(analysis), stderr:Number(error) }});
    }
    return checked(rows,13);
  },
};
export default board;
