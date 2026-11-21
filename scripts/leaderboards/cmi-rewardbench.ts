// CMI-RewardBench evaluates music judges on musicality and agreement with multimodal instructions.
// Tables 2 and 3 report both correlations and accuracies. The headline is the first musicality measure, PAM LCC.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2603.00610';
const musicality = ['pamLCC', 'pamSRCC', 'pamKtau', 'musicEvalLCC', 'musicEvalSRCC', 'musicEvalKtau', 'arenaACC', 'prefACC'];
const alignment = ['alignmentLCC', 'alignmentSRCC', 'alignmentKtau', 'text', 'textLyrics', 'textAudio', 'textLyricsAudio', 'withoutAudio', 'withAudio'];
const parts: Record<string, BoardPart> = {};
for (const [key, name] of Object.entries({ pamSRCC: 'PAM Spearman correlation', pamKtau: 'PAM Kendall tau', musicEvalSRCC: 'MusicEval Spearman correlation', musicEvalKtau: 'MusicEval Kendall tau', alignmentSRCC: 'PAM alignment Spearman correlation', alignmentKtau: 'PAM alignment Kendall tau' })) {
  parts[key] = { name, unit: 'score', group: key.startsWith('alignment') ? 'Alignment' : 'Musicality' };
}
for (const [key, name] of Object.entries({
  pamLCC: 'PAM LCC', musicEvalLCC: 'MusicEval LCC', arenaACC: 'Music Arena accuracy', prefACC: 'CMI-Pref accuracy',
  alignmentLCC: 'PAM alignment LCC', text: 'Text–Music', textLyrics: 'Text and lyrics',
  textAudio: 'Text and audio', textLyricsAudio: 'Text, lyrics and audio', withoutAudio: 'Without audio', withAudio: 'With audio',
})) parts[key] = { name, unit: key.endsWith('LCC') ? 'score' : '%', group: musicality.includes(key) ? 'Musicality' : 'Alignment' };

const board: Leaderboard = {
  benchmark: 'cmi-rewardbench', url: 'https://github.com/Haiwen-Xia/CMI-RewardBench', feed, parts,
  terms: PAPER_TERMS + ' https://arxiv.org/abs/2603.00610',
  async fetch() {
    const all = paperTables(await paperHtml(feed)).map(grid);
    const m = all.find(t => t[0][0] === 'Musicality' && t[1]?.slice(1).join('/') === 'LCC/SRCC/K-Tau/LCC/SRCC/K-Tau/ACC/ACC');
    const a = all.find(t => t[0].includes('CMI-Pref (Subsets)') && t[4]?.slice(1).join('/') === 'LCC/SRCC/K-Tau/ACC/ACC/ACC/ACC/ACC/ACC');
    if (!m || !a) throw new Error('Missing main musicality or alignment table');
    const rows = m.slice(2).map(([label, ...mus]) => {
      const other = a.find(r => r[0].toLowerCase() === label.toLowerCase());
      const metrics: Record<string, number> = {};
      const read = (keys: string[], values: string[]) => {
        if (keys.length !== values.length) throw new Error('Changed CMI result columns');
        keys.forEach((key, i) => {
          if (!/^-?\d+(?:\.\d+)?\s*%?$/.test(values[i])) throw new Error('Invalid ' + key);
          metrics[key] = parseFloat(values[i]);
        });
      };
      read(musicality, mus);
      if (other) read(alignment, other.slice(1));
      const variant = label.startsWith('- ');
      return { model: variant ? 'CMI-RM' : label, ...(variant ? { setting: label.slice(2) } : {}), score: metrics.pamLCC, metrics };
    });
    return checked(rows, 16);
  },
};
export default board;
