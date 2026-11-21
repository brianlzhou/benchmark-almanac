// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// MADASR 2.0 tests speech recognition across Indian languages. Each training track has a spreadsheet with
// independently sorted read and spontaneous test results. The organizers publish four named baseline checkpoints.
// Their challenge paper identifies Team YS's model as Whisper-large-v3 fine-tuned with MixLoRA.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://sites.google.com/view/respinasrchallenge2025/leaderboard';
const base = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBeK-lZzR05AAMW0zpumjsqeddJUMxLhMi8Q2kJMb0k403ROA0ByQ4OBQJ9YtZ6uBaZneinNAeQzAd/pub';
const feeds = ['0', '1700910199', '1897043835', '1295974149'].map(gid => base + '?gid=' + gid + '&single=true&output=csv');
const languages = ['bh', 'bn', 'ch', 'kn', 'mg', 'mr', 'mt', 'te'];
const parts: Record<string, BoardPart> = {};
for (const [key, name] of [['read', 'Read speech'], ['spontaneous', 'Spontaneous speech']]) {
  parts[key] = { name, note: 'Overall character error rate', better: 'lower' };
  for (const lang of languages) parts[key + '_' + lang] = { name: lang, group: name, better: 'lower' };
}
const board: Leaderboard = {
  benchmark: 'madasr-2', url, feed: feeds[0], parts,
  terms: 'The MADASR organizers publish the final results on the challenge leaderboard. https://sites.google.com/view/respinasrchallenge2025/leaderboard',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [i, feed] of feeds.entries()) {
      if (i) await new Promise(resolve => setTimeout(resolve, 1000));
      const [title, header, langs, ...data] = (await fetchText(feed)).trim().split(/\r?\n/).map(line => line.split(','));
      if (!title[0].startsWith('Track' + (i+1) + ' - Read') || !title[14].includes('Spontaneous')
          || [0, 14].some(n => header[n+1] !== 'Overall CER (%)' || langs.slice(n+5, n+13).join() !== languages.join()))
        throw new Error('MADASR track headers changed');
      const teams = new Map<string, Record<string, number>>();
      for (const line of data) {
        for (const [offset, key] of [[0, 'read'], [14, 'spontaneous']] as const) {
          const team = line[offset];
          if (!['baseline', 'YS'].includes(team)) continue;
          const metrics = teams.get(team) ?? {};
          const fields = [key, key+'WER', key+'LID', key+'DID', ...languages.map(lang => key + '_' + lang)];
          for (const [j, field] of fields.entries()) {
            const cell = line[offset+1+j];
            if (cell === 'NA' && (j === 2 || j === 3)) continue;
            if (!/^\d+(?:\.\d+)?$/.test(cell)) throw new Error('Unexpected ASR score');
            metrics[field] = Number(cell);
          }
          teams.set(team, metrics);
        }
      }
      for (const [team, metrics] of teams) {
        const model = team === 'YS' ? 'Whisper-large-v3 (MixLoRA)' : 'respin_asru25_track' + (i+1);
        rows.push({ model, submitter: team, setting: 'Track ' + (i+1), metrics, score: (metrics.read + metrics.spontaneous) / 2 });
      }
    }
    return checked(rows, 5);
  },
};
export default board;
