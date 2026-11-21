// Polish Medical Exams tests medical knowledge on Polish specialist, dental, and general exams.
// The Space defines Average as "ALL_ACCS[['PES', 'LDEK', 'LEK']].mean(axis=1).round(2)".
// It rounds exam accuracies before averaging them. English editions have separate tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://huggingface.co/spaces/amu-cai/Polish_Medical_Exams';
const base = url + '/resolve/main/leaderboards/';
const board: Leaderboard = {
  benchmark: 'polish-medical-exams', url, feed: base + 'pes_accs.json',
  terms: 'The authors publish the exam results in their Hugging Face Space. https://huggingface.co/spaces/amu-cai/Polish_Medical_Exams',
  aliases: {
    'mistralai/Mistral-Small-Instruct-2409': 'mistral-small-v24-09',
    'mistralai/Mistral-Large-Instruct-2407': 'mistral-large-2-jul-2024',
    'meta-llama/Meta-Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'meta-llama/Meta-Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'meta-llama/Llama-3.2-3B-Instruct': 'llama-3-2-3b',
    'meta-llama/Llama-3.2-1B-Instruct': 'llama-3-2-1b',
    'Qwen/Qwen2.5-7B-Instruct': 'qwen2-5-7b',
  },
  parts: {},
  async fetch() {
    const models = new Map<string, LeaderboardRow>();
    for (const exam of ['pes', 'ldek', 'lek', 'ldek_en', 'lek_en']) {
      if (exam !== 'pes') await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await fetchJson<Record<string, string | number>[]>(base + exam + '_accs.json');
      const group = exam.toUpperCase().replace('_EN', ' (English)');
      board.parts![exam] = group;
      for (const {model_name, overall_accuracy, ...parts} of data) {
        if (typeof model_name !== 'string' || !Number.isFinite(overall_accuracy)) throw new Error('Missing exam result');
        const model = model_name.replace('model-meta-llama-Llama-3.1-8B-Instruct', 'model-meta-llama-Meta-Llama-3.1-8B-Instruct').replace(/^model-/, '').replace(/^(meta-llama|mistralai|OpenMeditron|Qwen|ProbeMedicalYonseiMAILab|speakleash|BioMistral|johnsnowlabs|aaditya)-/, '$1/');
        const row: LeaderboardRow = models.get(model) ?? {model, score: 0, metrics: {}};
        row.metrics![exam] = Number(Number(overall_accuracy).toFixed(2));
        for (const [name, value] of Object.entries(parts)) {
          if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid exam component: ' + name);
          const key = exam + '_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          board.parts![key] = {name, group};
          row.metrics![key] = value;
        }
        models.set(model, row);
      }
    }
    for (const row of models.values()) {
      const {pes, ldek, lek} = row.metrics!;
      row.score = Number(((pes + ldek + lek) / 3).toFixed(2));
    }
    return checked([...models.values()], 17);
  },
};
export default board;
