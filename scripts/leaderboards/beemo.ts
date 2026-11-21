// The source reports no overall score. The headline is the plain mean of the 7 parts, computed by this importer.
// Beemo evaluates detectors of machine-generated and edited text. Table 4 reports AUROC for seven comparisons.
// Tables 14 through 18 repeat the comparisons for the five writing categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2025.naacl-long.357.pdf';
const contrasts = ['H vs. M', 'E vs. M', 'H vs. E', 'L vs. M', 'H vs. L', 'G vs. M', 'H vs. G'];
const categories = ['Generation', 'Open QA', 'Summarize', 'Rewrite', 'Closed QA'];
const methods = ['Log Probability', 'Rank', 'Log-Rank', 'Entropy', 'DetectLLM Likelihood Log-Rank Ratio', 'DetectLLM Normalized Perturbed Log-Rank', 'DetectGPT'];
const parts: Record<string, string> = Object.fromEntries([...contrasts.map(c => [c.replace(/[^A-Za-z0-9]/g, ''), c]), ...categories.flatMap(category => contrasts.map(c => [(category + ': ' + c).replace(/[^A-Za-z0-9]/g, ''), category + ': ' + c]))]);
const board: Leaderboard = {
  benchmark: 'beemo', url: 'https://aclanthology.org/2025.naacl-long.357/', feed, static: 'paper', parts,
  terms: 'The published paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',
  headline: 'The paper reports no overall score, so this is the plain mean of its seven AUROC comparisons.',
  aliases: { 'GPT2-XL': 'gpt-2-1-5b' },
  async fetch() {
    const pdf = await pdfText(feed);
    const rows = new Map<string, LeaderboardRow>();
    for (const [index, number] of [4, 14, 15, 16, 17, 18].entries()) {
      const caption = pdf.indexOf('Table ' + number + ': The AUROC scores');
      if (caption < 0) throw new Error('Missing Beemo table ' + number);
      const page = pdf.slice(pdf.lastIndexOf('\f', caption), caption);
      if (!page.includes('Zero-shot MGT Detectors') || !contrasts.every(c => page.includes(c))) throw new Error('Missing Beemo columns');
      let family = -1;
      let count = 0;
      for (const line of page.split('\n')) {
        const match = /^(.*?)\s+((?:\d+\.\d+\s+){6}\d+\.\d+)\s*$/.exec(line);
        if (!match) continue;
        const values = match[2].trim().split(/\s+/).map(Number);
        let model = match[1].trim();
        let setting: string | undefined;
        const base = /(GPT2-XL|OPT-1\.3B|Falcon-7B|Qwen2-7B)$/.exec(model);
        if (base) {
          model = base[1];
          if (model === 'GPT2-XL') family++;
          setting = methods[family];
          if (!setting || !page.includes(setting.split(' ').at(-1)!)) throw new Error('Unknown detector configuration');
        }
        const key = JSON.stringify([model, setting]);
        if (!index) rows.set(key, { model, setting, score: values.reduce((a,b) => a+b, 0) / 7, metrics: {} });
        const row = rows.get(key);
        if (!row) throw new Error('Missing overall configuration for ' + model);
        contrasts.forEach((contrast, i) => {
          const name = index ? categories[index - 1] + ': ' + contrast : contrast;
          const metric = name.replace(/[^A-Za-z0-9]/g, '');
          parts[metric] = name;
          row.metrics![metric] = values[i];
        });
        count++;
      }
      if (count !== 34) throw new Error('Expected 34 configurations in Table ' + number);
    }
    return checked([...rows.values()], 34);
  },
};
export default board;
