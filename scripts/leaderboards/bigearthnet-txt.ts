// BigEarthNet.txt tests satellite image captioning, visual question answering and localization.
// The authors put captioning BLEU-4 first in their main results table. They report accuracy and mIoU separately.
// The adapted InternVL result comes from the companion fine-tuning table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const site = 'https://txt.bigearth.net/';
const feed = site + 'static/tables/tab_main_table.html';
const board: Leaderboard = {
  benchmark: 'bigearthnet-txt', url: site + '#jmp_results', feed,
  terms: 'The project website uses CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/.',
  aliases: { GPT: 'gpt-5-2', InternVL: 'internvl3-1b', GLM: 'glm-4-6v-flash' },
  parts: { captioning: 'Captioning', vqa: 'Binary VQA', mcq: 'MCQ', detection: 'Ref. Exp. Detection' },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [url, adapted] of [[feed,false],[site+'static/tables/tab_main_table_ours.html',true]] as const) {
      const table = tables(await fetchText(url)).find(t => t[0]?.slice(-4).map(c=>c.text).join('|') === 'Captioning|Binary VQA|MCQ|Ref. Exp. Detection');
      if (!table) throw new Error('Missing BigEarthNet.txt result columns');
      for (const cells of table.slice(1)) {
        const label = cells[0].text;
        if (cells.length === 1 || /^SOTA (CV|RS)$/.test(label)) continue;
        if (cells.length !== (adapted ? 6 : 8)) throw new Error('Unexpected table width for ' + label);
        const values = cells.slice(-4).map(c=>c.text);
        if (!values.every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Missing score for ' + label);
        const [captioning, vqa, mcq, detection] = values.map(Number);
        const [model, setting] = label.match(/^(EarthDial|EarthMind) (rgb|s2|s1s2)$/)?.slice(1) ?? [label];
        const params = cells[2].text.match(/^(\d+)B$/);
        rows.push({ model, setting, ...(!adapted && params ? {params: +params[1]} : {}), score: captioning, metrics: {captioning, vqa, mcq, detection} });
      }
    }
    return checked(rows, 13);
  },
};
export default board;
