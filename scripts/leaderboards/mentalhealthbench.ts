import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://cdn.openai.com/ctf-cdn/MentalHealthBench_A_Comprehensive_Benchmark_of_AI_Capabilities_in_Realistic_Mental_Health_Conversations.pdf';
const N = 17;
// the figure's rows between its heading and its caption: a model name, then one score per panel
function figure(text: string, from: string, to: string, cols: number): Map<string, number[]> {
  const section = text.split(from)[1]?.split(to)[0];
  if (!section) throw new Error(`MentalHealthBench: "${from}" missing`);
  const num = String.raw`\s+(\d+\.\d+)`;
  const re = new RegExp(String.raw`^\s*(\S.*?)` + num.repeat(cols) + String.raw`\s*$`, 'gm');
  const out = new Map([...section.matchAll(re)].map((m) => [m[1].trim(), m.slice(2, 2 + cols).map(Number)]));
  if (out.size !== N) throw new Error(`MentalHealthBench "${to}" has ${out.size} rows, expected ${N}`);
  return out;
}
const board: Leaderboard = {
  benchmark: 'mentalhealthbench', static: 'paper', url: URL, feed: URL + ' (Figures 5, 7, 10 and 11, PDF text layer)',
  terms: 'OpenAI publishes this technical report for public reading. The CDN has no robots.txt restriction on this path. Numeric results are attributed to the report authors.',
  stats: { penaltyBurden: { name: 'Normalized penalty burden', unit: '%', better: 'higher', note: 'Negative rubric points incurred, normalized by total possible positive points.' }, positivePointsAchieved: { name: 'Positive points achieved', unit: '%', better: 'higher', note: 'Positive rubric points earned as a fraction of total possible positive points.' } },
  // the paper's breakdowns of the same task-clipped score: by acuity (Figure 7), by user profile (Figure 10) and
  // on the tasks with prior user context (Figure 11). Its per-axis scores (Figure 8) are signed contributions, not parts.
  parts: {
    nonAcute: { name: 'Non-acute', group: 'Acuity', note: 'Low-urgency, everyday conversations with some emotional weight, such as venting or relationship advice. About 54% of tasks.' },
    highAcuity: { name: 'High acuity', group: 'Acuity', note: 'Not emergencies, but with significant symptoms such as severe depression or panic attacks. About 18% of tasks.' },
    emergent: { name: 'Emergency', group: 'Acuity', note: 'Psychiatric emergencies, where the user may be at risk of harm to self or others. About 28% of tasks.' },
    adult: { name: 'Adult', group: 'User', note: 'A typical user aged 18 or older. About 68% of tasks.' },
    teen: { name: 'Teen', group: 'User', note: 'A user aged 13 to 17. About 21% of tasks.' },
    clinician: { name: 'Clinician', group: 'User', note: 'A mental health professional asking about practice, such as billing or treatment planning. About 6% of tasks.' },
    caregiver: { name: 'Caregiver', group: 'User', note: 'Someone caring for a loved one with a medical or mental illness. About 5% of tasks.' },
    priorContext: { name: 'Prior user context', group: 'Context', note: 'The 70 tasks with history that comes before the first user message.' },
  },
  async fetch() {
    const text = await pdfText(URL);
    const section = text.split('a) Task-clipped score')[1]?.split('Figure 5.')[0];
    if (!section) throw new Error('MentalHealthBench Figure 5 missing');
    const acuity = figure(text, 'c) Emergent', 'Figure 7.', 3);
    const user = figure(text, 'd) Caregiver', 'Figure 10.', 4);
    const prior = figure(text, 'Performance on conversations with prior user context', 'Figure 11.', 1);
    const rows = [...section.matchAll(/^\s*(\S.*?)\s{2,}(\d+\.\d+)\s+[−-](\d+)\s+(\d+)\s*$/gm)].map((m) => {
      const name = m[1].trim();
      const a = acuity.get(name), u = user.get(name), p = prior.get(name);
      if (!a || !u || !p) throw new Error(`MentalHealthBench: ${name} missing from a breakdown figure`);
      return {
        model: paperModel(name), score: Number(m[2]), trials: 4,
        setting: 'default API reasoning, temperature and verbosity; GPT-5.6 Sol high-reasoning judge',
        metrics: {
          penaltyBurden: -Number(m[3]), positivePointsAchieved: Number(m[4]),
          nonAcute: a[0], highAcuity: a[1], emergent: a[2],
          adult: u[0], teen: u[1], clinician: u[2], caregiver: u[3],
          priorContext: p[0],
        },
      };
    });
    if (rows.length !== N) throw new Error(`MentalHealthBench Figure 5 has ${rows.length} rows, expected ${N}`);
    return rows;
  },
};
export default board;
