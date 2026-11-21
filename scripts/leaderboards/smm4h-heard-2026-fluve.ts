// FluVE ranks systems by macro F1 across vaccination status and flu test classification.
// Table 3 of the organizers' proceedings gives the overall score and six component scores.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2026.smm4h-1.53.pdf";

const board: Leaderboard = {
  benchmark: "smm4h-heard-2026-fluve", static: 'paper',
  url: "https://www.codabench.org/competitions/14035",
  feed: FEED,
  terms: "No score reuse license verified. CodaBench challenged the leaderboard request. The organizers publish the results through ACL Anthology.",
  parts: { vaccinationMicro: 'Vaccination Status Micro F1', vaccinated: 'Currently-Vaccinated F1', unvaccinated: 'Currently-Unvaccinated F1',
    testMicro: 'Flu Test Micro F1', positive: 'Currently-Positive F1', negative: 'Currently-Negative F1' },
  async fetch() {
    const pdf = await pdfText(FEED);
    const table = pdf.split('Table 3: Results on SMM4H-HeaRD 2026 Task 3')[0].split(/Mic\. F1\s+Pos\. F1\s+Neg\. F1/).at(-1);
    if (!table || !/Vacc\. F1\s+Unvacc\. F1/.test(pdf)) throw new Error('Missing FluVE table');
    const rows = [...table.matchAll(/^ *([^\n]+?)\s+((?:0\.\d+[ \t]+){6}0\.\d+)\s+[^\n]+/gm)].map(([, name, values]) => {
      const model = name.trim() === 'Cuet_Data_' ? 'Cuet_Data_Wizards' : name.trim();
      const [score, vaccinationMicro, vaccinated, unvaccinated, testMicro, positive, negative] = values.trim().split(/\s+/).map(Number);
      return { model, submitter: model, score, metrics: { vaccinationMicro, vaccinated, unvaccinated, testMicro, positive, negative } };
    });
    if (rows.length < 7) throw new Error('Missing FluVE systems');
    return rows;
  },
};
export default board;
