// The archive tests forecasts of 469 treatment effects across 70 social science experiments.
// Figure 1B's source workbook reports corrected and raw correlations with their confidence intervals.
// Figure 1C gives the corresponding subgroup estimates for GPT-4.
import type { Leaderboard } from './types.ts';
import { execFileSync } from 'node:child_process';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://static-content.springer.com/esm/art%3A10.1038%2Fs41586-026-10742-x/MediaObjects/41586_2026_10742_MOESM4_ESM.xlsx';
const readPanels = `
import io, json, sys, zipfile, xml.etree.ElementTree as ET
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as book:
    sheets = ET.fromstring(book.read('xl/workbook.xml')).findall('.//{*}sheet')
    if [sheet.attrib['name'] for sheet in sheets] != ['panelA','panelB','panelC']:
        raise ValueError('Figure 1 panel names changed')
    result = []
    for index in (2,3):
        rows = ET.fromstring(book.read(f'xl/worksheets/sheet{index}.xml')).findall('.//{*}row')
        header = {c.attrib['r'][:-1]: ''.join(c.itertext()) for c in rows[0]}
        result.append([{header[c.attrib['r'].rstrip('0123456789')]: ''.join(c.itertext()) for c in row} for row in rows[1:]])
    print(json.dumps(result))
`;
const board: Leaderboard = {
  benchmark: 'social-science-experiment-treatment-effect-archive', static: 'paper', url: 'https://www.nature.com/articles/s41586-026-10742-x', feed,
  terms: 'Nature lists the rights for the article and its source data at https://www.nature.com/articles/s41586-026-10742-x#rightslink.',
  headline: 'Figure 1B reports the correlation with observed treatment effects after correcting for sampling error.',
  aliases: { 'deepseek/deepseek-chat-v3-0324': 'deepseek-v3-mar-2025', 'google/gemma-3-27b-it': 'gemma-3-27b', 'openai/gpt-oss-120b': 'gpt-oss-120b' },
  parts: {}, stats: { raw: { name: 'Raw Pearson correlation', unit: 'score', better: 'higher' } },
  async fetch() {
    const json = execFileSync('python3',['-c',readPanels],{input:Buffer.from(await fetchBytes(feed)),encoding:'utf8'});
    const [overall,subgroups]: Record<string,string>[][] = JSON.parse(json);
    return checked(overall.filter(r => r.model_class !== 'human').map(r => {
      const metrics: Record<string,number> = { raw: Number(r.cor_raw), rawLow: Number(r['cor_raw_ci.lb']), rawHigh: Number(r['cor_raw_ci.ub']) };
      for (const part of subgroups.filter(p => p.model === r.model)) {
        board.parts![part.spec] = part.spec;
        metrics[part.spec] = Number(part.estimate);
      }
      const score = Number(r.estimate), low = Number(r['ci.lb']), high = Number(r['ci.ub']);
      if (![score,low,high,...Object.values(metrics)].every(Number.isFinite)) throw new Error('Missing Figure 1 correlation or interval');
      return {model:r.model,score,low,high,metrics};
    }),6);
  },
};
export default board;
