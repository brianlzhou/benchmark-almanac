// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// MusicEval tests predictions of expert ratings for musical quality and agreement with a text prompt.
// AudioMOS Track 1 publishes its raw results in the official spreadsheet. The primary metric is system-level SRCC.
// The organizers identify B01 and describe T09's nine-model stacking ensemble in https://arxiv.org/abs/2509.01336.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://docs.google.com/spreadsheets/d/17s9hKRwbvDlcGDgJUm5tN6UHX7rqBk2lyv8xFwUsUPg/export?format=csv&gid=0';
const board: Leaderboard = {
  benchmark: 'musiceval',
  url: 'https://sites.google.com/view/voicemos-challenge/past-challenges/audiomos-challenge-2025',
  feed,
  terms: 'The AudioMOS organizers publish these results on Google Sheets under https://policies.google.com/terms.',
  headline: 'The headline averages the system-level Spearman correlations for overall musical quality and textual alignment.',
  parts: { qualitySystemSRCC: 'Overall musical quality', alignmentSystemSRCC: 'Textual alignment' },
  async fetch() {
    const [section, axes, levels, measures, ...body] = (await fetchText(feed)).trim().split(/\r?\n/).map(line => line.split(','));
    const groups = ['qualityUtterance', 'qualitySystem', 'alignmentUtterance', 'alignmentSystem'];
    const keys = ['MSE', 'LCC', 'SRCC', 'KTAU'];
    if (section[1] !== 'Raw scores' || section[17] !== 'Rankings' || axes[1] !== 'OVERALL_MUSICAL_QUALITY' ||
        !/^TEXTUALL?_ALIGNMENT$/.test(axes[9]) || groups.some((group, i) => {
          const offset = 1 + i * 4;
          return levels[offset] !== (group.endsWith('System') ? 'System-level' : 'Utterance-level') ||
            measures.slice(offset, offset + 4).join(',') !== keys.join(',');
        })) throw new Error('Track 1 score headers changed');
    const rows: LeaderboardRow[] = [];
    for (const [team, ...cells] of body) {
      if (team !== 'B01' && team !== 'T09') continue;
      const metrics: Record<string, number> = {};
      for (const [i, group] of groups.entries()) {
        for (const [j, key] of keys.entries()) {
          const value = cells[i * 4 + j];
          if (!/^-?\d+(?:\.\d+)?$/.test(value)) throw new Error('Missing Track 1 score for ' + team);
          metrics[group + key] = Number(value);
        }
      }
      rows.push({
        model: team === 'B01' ? 'CLAP (AudioMOS Track 1 baseline)' : 'MuQ and RoBERTa stacking ensemble',
        ...(team === 'T09' ? { models: ['MuQ', 'RoBERTa'] } : {}),
        submitter: team, score: (metrics.qualitySystemSRCC + metrics.alignmentSystemSRCC) / 2, metrics,
      });
    }
    return checked(rows, 2);
  },
};
export default board;
