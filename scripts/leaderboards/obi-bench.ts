// OBI-Bench tests how well vision language models read oracle bone inscriptions.
// Tables 2 through 6 report five tasks with different measures and directions.
// The headline is cosine similarity on the first recognition question in Table 2.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2412.01175';
const tasks = [
  { name: 'Recognition', headers: ['What', 'Yes-or-No', 'How', 'Where'], datasets: ['O2BR', 'YinQiWenYuan detection'] },
  { name: 'Rejoining', headers: ['Yes-or-No', 'Acc@1', 'Acc@5', 'Acc@10'], datasets: ['OBI-rejoin'] },
  { name: 'Classification', headers: ['Yes-or-No', 'Acc@1', 'Acc@5'], datasets: ['HWOBC', 'Oracle-50k', 'OBI125'] },
  { name: 'Retrieval', headers: ['mAP@|Yes|', 'Recall@1', 'Recall@3', 'Recall@10', 'mAP@5'], datasets: ['OBC306', 'OBI-IJDH'] },
  { name: 'Deciphering', headers: ['Tier-1', 'Tier-2', 'Tier-3', 'pictograph', 'ideogram', 'Radical', 'Average'], datasets: ['HUST-OBS', 'HUST-OBS', 'HUST-OBS', 'EVOBC', 'EVOBC', 'OBI Component 20', ''] },
];
const parts: Record<string, BoardPart> = {};
const columns = tasks.map(({ name, headers, datasets }, t) => {
  const result: string[][] = [];
  for (let d = 0; d < datasets.length; d++) {
    for (const [h, header] of headers.entries()) {
      if (t === 4 && d !== h) continue;
      const column = t === 0 ? d * headers.length + h : h;
      const key = [name, datasets[d], header].join(' ').replace(/[^a-z0-9]/gi, '');
      parts[key] = {
        name: [datasets[d], header].filter(Boolean).join(': '), group: name,
        unit: t === 1 || t === 2 || (t === 0 && h === 1) ? '%' : 'score',
        better: t === 0 && h === 2 ? 'lower' : 'higher',
      };
      (result[column] ??= []).push(key);
    }
  }
  return result;
});

const board: Leaderboard = {
  benchmark: 'obi-bench', static: 'paper', url, feed: url, terms: PAPER_TERMS, parts,
  headline: 'The paper gives no overall score, so the headline is cosine similarity on the O2BR recognition question “What”.',
  aliases: {
    'GPT-4o (ver. 0806)': 'gpt-4o-aug-2024',
    'mPLUG-Owl3 (Qwen2-7B)': 'mplug-owl3-7b',
    'MiniCPM-V 2.6 (Qwen2-7B)': 'minicpm-v-2-6',
    'InternVL2-Llama3-76B (Llama3-70B)': 'internvl2-llama3-76b',
    'InternVL2-40B (Nous-Hermes2-Yi-34B)': 'internvl2-40b',
    'InternVL2-8B (InternLM2.5-7B)': 'internvl2-8b',
    'GLM-4V-9B (GLM-4-9B)': 'glm-4v-9b',
    'CogVLM2-Llama3-19B (Llama3-8B)': 'cogvlm2-llama3-chat-19b',
    'LLaVA-NeXT (Qwen1.5-72B)': 'llava-next-72b',
    'LLaVA-NeXT (Llama3-8B)': 'llama3-llava-next-8b',
    'IDEFICS-2-8B (Mistral-7B)': 'idefics2-8b',
    'InternLM-XComposer2-VL (InternLM2-7B)': 'internlm-xcomposer2-vl-7b',
    'LLaVA-v1.5 (Vicuna-v1.5-13B)': 'llava-v1-5-13b',
    'LLaVA-v1.5 (Vicuna-v1.5-7B)': 'llava-v1-5-7b',
  },
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const rows = new Map<string, LeaderboardRow>();
    for (const [i, task] of tasks.entries()) {
      const expected = i === 0 ? [...task.headers, ...task.headers] : task.headers;
      const table = tables.find(t => JSON.stringify(t[1]?.slice(1).map(s => s.split('\\')[0])) === JSON.stringify(expected));
      if (!table) throw new Error('Missing table for ' + task.name);
      const seen = new Set<string>();
      for (const [label, ...cells] of table.slice(2)) {
        if (/^Human\b|LMMs:$/.test(label)) continue;
        const model = label.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
        if (seen.has(model) || cells.length !== expected.length) throw new Error('Unexpected row for ' + model);
        seen.add(model);
        if (i === 0) rows.set(model, { model, score: NaN, metrics: {} });
        const row = rows.get(model);
        if (!row) throw new Error('Unrecognized model: ' + model);
        for (const [c, cell] of cells.entries()) {
          const values = cell.split('/').map(v => v.trim());
          const keys = columns[i][c];
          if (keys.length !== values.length) throw new Error('Missing values for ' + model);
          values.forEach((value, j) => {
            if (value === "<10e-4") return; // The paper gives only an upper bound.
            if (!/^\d+(?:\.\d+)?%?$/.test(value)) throw new Error('Unexpected value: ' + value);
            row.metrics![keys[j]] = parseFloat(value);
          });
        }
        if (i === 0) row.score = row.metrics![columns[0][0][0]];
      }
      if (seen.size !== [23, 17, 17, 17, 23][i]) throw new Error('Changed model count for ' + task.name);
    }
    return checked([...rows.values()], 23);
  },
};
export default board;
