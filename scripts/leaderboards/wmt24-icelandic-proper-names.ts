// The WMT24 suite tests correct Icelandic place names and personal names in translation.
// Table 5 gives the proportion correct overall and for both types of names.
// The WMT24 findings identify participant models in Appendix B: https://aclanthology.org/2024.wmt-1.1/.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2024.wmt-1.31.pdf';
const entrants: Record<string,[string,string]> = {
  Aya23:['Aya23','WMT24'], 'Claude-3.5':['Claude-3.5','WMT24'], 'CommandR-plus':['CommandR-plus','WMT24'],
  'GPT-4':['GPT-4','WMT24'], 'Llama3-70B':['Llama3-70B','WMT24'],
  'Unbabel-Tower70B':['Tower v2 70B','Unbabel-IST'], IKUN:['IKUN','IKUN'], 'IKUN-C':['IKUN-C','IKUN'],
  TranssionMT:['Hyper-SNMT','TranssionMT'], CycleL:['CycleGN','CycleL'],
};
const board: Leaderboard = {
  benchmark:'wmt24-icelandic-proper-names', feed, url:'https://aclanthology.org/2024.wmt-1.31/', static:'paper',
  terms:'The ACL Anthology publishes the article under the terms at https://aclanthology.org/2024.wmt-1.31/.',
  aliases:{'Claude-3.5 (snapshot unspecified)':'claude-3-5-sonnet','CommandR-plus':'command-r-plus'},
  parts:{city:'Total city score',people:'Total people score'},
  async fetch() {
    const paper = await pdfText(feed);
    const t = paper.match(/System name\s+Total score\s+Total city score\s+Total people score([\s\S]+?)Table 5:/)?.[1];
    if (!t) throw new Error('Missing Table 5 name scores');
    const rows = t.trim().split('\n').flatMap(line => {
      const [name,overall,city,people] = line.trim().split(/\s+/);
      if (!Object.hasOwn(entrants,name)) return [];
      const [model,submitter] = entrants[name];
      const percent = (v: string) => Number((Number(v)*100).toFixed(4));
      if (![overall,city,people].every(v => /^(?:0\.\d+|1(?:\.0+)?)$/.test(v))) throw new Error('Invalid proper-name accuracy');
      return [{model,submitter,score:percent(overall),metrics:{city:percent(city),people:percent(people)}}];
    });
    return checked(rows,10);
  },
};
export default board;
