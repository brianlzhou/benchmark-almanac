// MedHELM: retain source mean-win-rate scores and per-scenario token figures.
import { fetchJson } from '../lib/util.ts';
import type { Leaderboard } from './types.ts';
import { HELM_BUCKET, helmNewest, HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'medhelm', group: 'medhelm_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100 };
const tokenScenarios = ['MedCalc-Bench', 'CLEAR', 'MTSamples', 'Medec', 'EHRSHOT', 'HeadQA', 'Medbullets', 'MedQA', 'MedMCQA', 'MedAlign', 'ADHD-Behavior', 'ADHD-MedEffects', 'DischargeMe', 'ACI-Bench', 'MTSamples Procedures', 'MIMIC-RRS', 'MIMIC-BHC', 'NoteExtract', 'MedicationQA', 'PatientInstruct', 'MedDialog', 'MedConfInfo', 'MEDIQA', 'MentalHealth', 'ProxySender', 'PrivacyDetection', 'PubMedQA', 'EHRSQL', 'BMT-Status', 'RaceBias', 'N2C2-CT', 'MedHallu', 'HospiceReferral', 'ClinicReferral', 'CDI-QA', 'ENT-Referral'];
const tokenStats = Object.fromEntries(tokenScenarios.flatMap(s => [[`${s} - # prompt tokens`, { name: `${s} prompt tokens`, unit: 'tokens' }], [`${s} - # output tokens`, { name: `${s} output tokens`, unit: 'tokens' }]]));

const board: Leaderboard = {
  benchmark: 'medhelm',
  url: 'https://crfm.stanford.edu/helm/medhelm/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  stats: tokenStats,
  async fetch() {
    const rows = await helmRows(TABLE);
    const newest = await helmNewest('medhelm');
    const tables = await fetchJson<any[]>(`${HELM_BUCKET}/${newest}groups/medhelm_scenarios.json`);
    const accuracy = tables.find(t => t.title === 'Accuracy');
    const scoreIndex = accuracy?.header.findIndex((h: any) => h.value === 'Mean win rate');
    const source = accuracy?.rows.filter((r: any) => typeof r[scoreIndex]?.value === 'number');
    if (!source || source.length !== rows.length) throw new Error('MedHELM changed during resource join');
    const general = tables.find(t => t.title === 'General information');
    for (let i = 0; i < rows.length; i++) {
      if (Math.abs(source[i][scoreIndex].value * 100 - rows[i].score) > 1e-8) throw new Error('MedHELM score join mismatch');
      const resource = general?.rows.find((r: any) => r[0]?.value === source[i][0]?.value);
      const metrics: Record<string, number> = {};
      general?.header.forEach((h: any, j: number) => {
        if (/ - # (?:prompt|output) tokens$/.test(h.value) && typeof resource?.[j]?.value === 'number') metrics[h.value] = resource[j].value;
      });
      // These are scenario-specific request counts. No unpublished whole-benchmark average is invented.
      rows[i].metrics = {...rows[i].metrics, ...metrics};
    }
    return rows;
  },
};
export default board;
