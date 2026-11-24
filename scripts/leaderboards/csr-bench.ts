// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// CSR-Bench measures deployment of research repositories. Tables 1 to 4 give task success
// for four successive agent configurations on the same repositories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.naacl-long.633.pdf';
const board: Leaderboard = {
  benchmark: 'csr-bench', static: 'paper', url: 'https://aclanthology.org/2025.naacl-long.633/', feed,
  terms: 'The paper and its license are available at https://aclanthology.org/2025.naacl-long.633/.',
  headline: 'The paper reports no overall success rate, so this is the plain mean of the five deployment task rates.',
  parts: { setup: 'Setup', download: 'Download', training: 'Training', evaluation: 'Evaluation', inference: 'Inference' },
  aliases: { 'GPT-4o-Mini (snapshot unspecified)': 'gpt-4o-mini' },
  async fetch() {
    const text = await pdfText(feed);
    const page = text.split('\f').find(p => p.includes('Table 1: Drafter Success Metrics') && p.includes('Table 4: Searcher Success Metrics'));
    if (!page) throw new Error('Missing deployment success tables');
    const rows: LeaderboardRow[] = [];
    const boundary = page.split('\n')[0].indexOf('Table 3:');
    if (boundary < 50) throw new Error('Missing right column');
    for (const side of [0, 1]) {
      const column = page.split('\n').map(line => side ? line.slice(boundary) : line.slice(0, boundary)).join('\n');
      for (const [i, harness] of (side ? ['Issue Retriever', 'Searcher'] : ['Drafter', 'Analyzer']).entries()) {
        const section = column.split(harness + ' Success Metrics')[1]?.split(/Table [1-4]:/)[0];
        if (!section || !/Name\s+S\s+D\s+T\s+E\s+I/.test(section)) throw new Error('Missing task columns for ' + harness);
        const start = rows.length;
        for (const line of section.split('\n')) {
          const match = line.match(/^\s*(?:(?:Claude|GPT|Llama|Mistral)\s+)?(Instant|3-Haiku|3-Sonnet|4o-Mini|4o|4-Turbo|3-70B|3\.1-8B|3\.1-70B|(?:Mistral-)?Large(?:-2)?)\s+((?:0\.\d+\s+){4}0\.\d+)\s*$/);
          if (!match) continue;
          const label = match[1].replace(/^Mistral-/, '');
          const family = /^(Instant|3-Haiku|3-Sonnet)$/.test(label) ? 'Claude' : /^4/.test(label) ? 'GPT' : /^3/.test(label) ? 'Llama' : 'Mistral';
          const [setup, download, training, evaluation, inference] = match[2].trim().split(/\s+/).map(v => Number((100 * Number(v)).toFixed(2)));
          rows.push({ model: family + '-' + label, harness, score: (setup + download + training + evaluation + inference) / 5,
            metrics: { setup, download, training, evaluation, inference } });
        }
        if (rows.length - start !== 11) throw new Error('Incomplete ' + harness + ' table ' + i);
      }
    }
    return checked(rows, 44);
  },
};
export default board;
