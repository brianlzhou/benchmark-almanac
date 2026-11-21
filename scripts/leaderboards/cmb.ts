// CMB tests Chinese medical knowledge with examinations and clinical case questions.
// Tables 6 and 7 report CMB-Exam average accuracy. Tables 8 and 9 report separate GPT-4 clinical ratings.
// The clinical ratings use a five-point scale and apply to the model independently of its exam prompting setting.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2308.08833';
const parts: Record<string, BoardPart> = {};
const clinicalNames: Record<string,string> = {
  'Yi-34B-Chat':'Yi-34B','Qwen-72B-Chat':'Qwen-72B','Baichuan2-13B-Chat':'Baichuan2-13B','Internlm-Chat-20B':'Internlm-20B',
  'Deepseek-llm-67B-Chat':'Deepseekllm-67B','Mixtral-8x7B-32kseqlen':'Mixtral-8x7B','DISC-MedLLM-13B':'DISC-MedLLM',
  'ChatMed-Consult-7B':'ChatMed-Consult','MedicalGPT-7B':'MedicalGPT','ChatGLM-Med-7B':'ChatGLM-Med','Bentsao-7B':'Bentsao',
  'DISC-MedLLM-13B (CMB-Exam-Train)':'DISC-MedLLM-Train',
};
const board: Leaderboard = {
  benchmark: 'cmb', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish the tables through arXiv. https://arxiv.org/abs/2308.08833',
  headline: 'The two tracks use different scales, so the headline is the CMB-Exam average accuracy.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const exams = tables.filter(t=>t[0].join('|') === 'Model|Open|Physician|Nurse|Pharmacist|Technician|Disciplines|Graduate Entrance Exam|Average');
    const clinical = tables.filter(t=>t[0][0] === 'Aspects' && t[1][0] === 'Fluency' && !t[1][1].includes('pm'));
    if (exams.length !== 2 || clinical.length !== 2) throw new Error('Missing CMB result tables');
    const ratings = new Map<string, Record<string, number>>();
    for (const t of clinical) {
      t[0].slice(1).forEach((model,i) => {
        const metrics: Record<string,number> = {};
        for (const [aspect,...values] of t.slice(1)) {
          const key = 'clinical' + aspect;
          parts[key] = {name: 'CMB-Clin: ' + aspect, unit:'score', group:'CMB-Clin', note:'GPT-4 rating on a five-point scale.'};
          metrics[key] = numberCell(values[i]);
        }
        ratings.set(model, metrics);
      });
    }
    const rows: LeaderboardRow[] = [];
    for (const t of exams) {
      let model = '';
      for (const [label,open,...cells] of t.slice(1)) {
        if (label === open) continue;
        if (label !== '+ CoT') model = label;
        const best = cells.every(c=>c.endsWith('*'));
        const values = cells.map(raw=>{
          const c = raw.replace(/(\d)\s+\./g, '$1.');
          const m = best ? /^([\d.]+)\*$/.exec(c) : /^([\d.]+)\s*\(\s*([\d.]+)\s*\)$/.exec(c);
          if (!m) throw new Error('Missing exam accuracy for ' + model);
          return m.slice(1).map(Number);
        });
        for (let shot = 0; shot < values[0].length; shot++) {
          const name = model.replace(/ \([^A-Za-z].*$/, '');
          const metrics = { ...ratings.get(clinicalNames[name] ?? name) };
          t[0].slice(2,-1).forEach((name,i) => {
            const key = name.replaceAll(' ','');
            parts[key] = {name, group:'CMB-Exam'};
            metrics[key] = values[i][shot];
          });
          const setting = best ? 'Best reported, generation strategy unspecified' :
            (shot ? 'Three-shot' : 'Zero-shot') + (label === '+ CoT' ? ', chain of thought' : ', answer only');
          rows.push({model, open: open === '\\checkmark', setting, score: values.at(-1)![shot], metrics});
        }
      }
    }
    return checked(rows, 115);
  },
};
export default board;
