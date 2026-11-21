// RoughCut-Bench tests visual editing and speech cleanup. The project's first leaderboard
// ranks Visual Set-1 by F1. Quality ratings and speech measures have separate tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://whalesong-zrs.github.io/RoughCut-Bench-Project-Page/';
const feed = url + 'data/leaderboards.json';
const parts = {
  visual_annotation_set1_precision: { name: 'Precision', group: 'Visual Annotation: Visual Set-1' }, visual_annotation_set1_recall: { name: 'Recall', group: 'Visual Annotation: Visual Set-1' }, visual_annotation_set1_f1: { name: 'F1', group: 'Visual Annotation: Visual Set-1' }, visual_annotation_set1_avgIou: { name: 'Avg. IoU', group: 'Visual Annotation: Visual Set-1' }, visual_annotation_set1_tau: { name: "Kendall's τ", group: 'Visual Annotation: Visual Set-1' },
  visual_annotation_set2_precision: { name: 'Precision', group: 'Visual Annotation: Visual Set-2' }, visual_annotation_set2_recall: { name: 'Recall', group: 'Visual Annotation: Visual Set-2' }, visual_annotation_set2_f1: { name: 'F1', group: 'Visual Annotation: Visual Set-2' }, visual_annotation_set2_avgIou: { name: 'Avg. IoU', group: 'Visual Annotation: Visual Set-2' }, visual_annotation_set2_tau: { name: "Kendall's τ", group: 'Visual Annotation: Visual Set-2' },
  visual_quality_set1_ordering: { name: 'Ordering', group: 'Visual Quality: Visual Set-1' }, visual_quality_set1_redundancy: { name: 'Redundancy', group: 'Visual Quality: Visual Set-1' }, visual_quality_set1_overall: { name: 'Overall', group: 'Visual Quality: Visual Set-1' }, visual_quality_set1_human: { name: 'Human Score', group: 'Visual Quality: Visual Set-1' },
  visual_quality_set2_ordering: { name: 'Ordering', group: 'Visual Quality: Visual Set-2' }, visual_quality_set2_requirement: { name: 'Requirement', group: 'Visual Quality: Visual Set-2' }, visual_quality_set2_redundancy: { name: 'Redundancy', group: 'Visual Quality: Visual Set-2' }, visual_quality_set2_overall: { name: 'Overall', group: 'Visual Quality: Visual Set-2' }, visual_quality_set2_human: { name: 'Human Score', group: 'Visual Quality: Visual Set-2' },
  speech_cleanup_all_imP: { name: 'IM P', group: 'Speech Cleanup: All Speech Cases' }, speech_cleanup_all_imR: { name: 'IM R', group: 'Speech Cleanup: All Speech Cases' }, speech_cleanup_all_imF1: { name: 'IM F1', group: 'Speech Cleanup: All Speech Cases' }, speech_cleanup_all_rmSuccess: { name: 'RM→R Succ.', group: 'Speech Cleanup: All Speech Cases' }, speech_cleanup_all_dP: { name: 'D P', group: 'Speech Cleanup: All Speech Cases' }, speech_cleanup_all_dR: { name: 'D R', group: 'Speech Cleanup: All Speech Cases' }, speech_cleanup_all_dF1: { name: 'D F1', group: 'Speech Cleanup: All Speech Cases' },
};
type SetData = {id: string, label: string, defaultSort: string, columns: {key: string, label: string}[], rows: {model: string, [key: string]: string | number}[]};
const board: Leaderboard = {
  benchmark: 'roughcut-bench', url, feed, parts,
  terms: 'The authors publish the results on the project website. ' + url,
  headline: 'The project reports no combined score and ranks its first table by Visual Set-1 F1.',
  aliases: {'Gemini 3.0 Pro': 'gemini-3-pro', 'Seed-2.0-Lite': 'seed-2-0-lite'},
  async fetch() {
    const data = await fetchJson<{views: {id: string, label: string, sets: SetData[]}[]}>(feed);
    const rows = new Map<string, LeaderboardRow>();
    const first = data.views[0]?.sets[0];
    if (data.views[0]?.id !== 'visual-annotation' || first?.id !== 'set1' || first.defaultSort !== 'f1') throw new Error('First leaderboard changed');
    let count = 0;
    for (const view of data.views) for (const set of view.sets) {
      count++;
      if (!set.columns.some(c => c.key === set.defaultSort) || set.rows.length < 8) throw new Error('Missing RoughCut results');
      for (const result of set.rows) {
        const row = rows.get(result.model) ?? {model: result.model, score: NaN, metrics: {} as Record<string,number>};
        for (const column of set.columns) {
          const key = [view.id.replaceAll('-', '_'), set.id, column.key].join('_');
          const value = result[column.key];
          if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing metric: ' + key);
          row.metrics![key] = value;
          board.parts![key] = {name: column.label, group: view.label + ': ' + set.label};
          if (set === first && column.key === 'f1') row.score = value;
        }
        rows.set(result.model, row);
      }
    }
    if (count < 5) throw new Error('Missing RoughCut table');
    return checked([...rows.values()], 8);
  },
};
export default board;
