// MELA tests linguistic acceptability in ten languages. Table 3 of the ACL paper reports each
// language's Matthews correlation coefficient times 100 and the mean across all ten languages.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2024.acl-long.146.pdf';
const languages = {en:'English', zh:'Chinese', it:'Italian', ru:'Russian', de:'German', fr:'French', es:'Spanish', ja:'Japanese', ar:'Arabic', is:'Icelandic'};
const board: Leaderboard = {
  benchmark: 'mela', static: 'paper', url: 'https://aclanthology.org/2024.acl-long.146/', feed,
  terms: 'ACL Anthology copyright and licensing terms. https://aclanthology.org/faq/copyright/',
  aliases: {'Baichuan2-Base 13B':'baichuan2-13b', 'Baichuan2-Chat 13B':'baichuan2-13b-chat'},
  headline: 'Table 3 reports the mean Matthews correlation coefficient across ten languages, multiplied by 100.',
  parts: Object.fromEntries(Object.entries(languages).map(([key,name]) => [key,{name,unit:'score',note:'Matthews correlation coefficient times 100.'}])),
  async fetch() {
    const paper = await pdfText(feed);
    const match = paper.match(/model\s+size\s+examples\s+en\s+zh\s+it\s+ru\s+de\s+fr\s+es\s+ja\s+ar\s+is\s+avg\s*([\s\S]+?)Table 3: Performance/);
    if (!match) throw new Error('Missing MELA Table 3');
    const rows = match[1].trim().split(/\n/).map(l => l.trim()).filter(l => l && !['Supervised','Open-sourced','Close-sourced'].includes(l)).map(line => {
      const [label,size,examples,...cells] = line.split(/\s+/);
      const values = cells.map(Number);
      if (values.length !== 11 || !values.every(Number.isFinite)) throw new Error('Invalid MELA row: ' + line);
      const supervised = label === 'XLM-R';
      const name = supervised ? label : label.replace(/[02]$/, '');
      const model = name + (size === '-' ? '' : ' ' + size);
      const setting = supervised ? 'Fine-tuned, v1.0' : examples === '-' ? 'Zero-shot, v1.1' : 'Two-shot, v1.1, ' + (examples === 'en' ? 'English examples' : 'in-language examples');
      return {model, setting, score: values[10], metrics: Object.fromEntries(Object.keys(languages).map((key,i) => [key,values[i]]))};
    });
    return checked(rows,22);
  },
};
export default board;
