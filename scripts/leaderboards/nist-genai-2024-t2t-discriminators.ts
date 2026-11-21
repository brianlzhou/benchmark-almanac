// NIST evaluated submitted detectors on human and machine-written summaries in three rounds.
// Each round reports the area under the ROC curve for each submission in its Dash table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://miganalytics.nist.gov/content/e1ec4f05-19e1-461f-8650-3c18ed60897b/';
const feed = url + '_dash-update-component';
const tables = ['T2T_discriminator_dash_table_r1', 'T2T_discriminator_table_r2', 'T2T_discriminator_dash_table_r3'];
type Entry = { submissionid: string; team: string; AUC: number } & Record<string, number | string>;

const board: Leaderboard = {
  benchmark: 'nist-genai-2024-t2t-discriminators',
  url, feed,
  terms: 'NIST permits copying unmarked public information with credit. Separate agreements govern the evaluation inputs. The site robots.txt disallows all paths.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [index, id] of tables.entries()) {
      if (index) await new Promise(resolve => setTimeout(resolve, 1000));
      const data = await fetchJson<{ response: Record<string, { data: Entry[] }> }>(feed, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ output: id + '.data', outputs: { id, property: 'data' },
          inputs: [{ id: 'search-input', property: 'value', value: '' }], changedPropIds: [], state: [] }),
      });
      const entries = data.response[id].data;
      if (entries.length < [148, 148, 180][index]) throw new Error('Missing NIST submissions in round ' + (index + 1));
      for (const entry of entries) {
        const metrics: Record<string, number> = {};
        for (const key of ['AUC@FPR=0.1', 'Brier', 'EER', 'TNR@FNR=0.1', 'TPR@FPR=0.1']) {
          const value = entry[key];
          if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid NIST ' + key);
          metrics[key] = value;
        }
        if (!entry.submissionid || !entry.team || !Number.isFinite(entry.AUC)) throw new Error('Invalid NIST submission');
        rows.push({ model: entry.submissionid, submitter: entry.team, setting: 'Round ' + (index + 1), score: entry.AUC, metrics });
      }
    }
    return rows;
  },
};

export default board;
