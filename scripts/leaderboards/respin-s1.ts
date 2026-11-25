// RESPIN compares ASR systems on nine Indian languages. Table 6 gives average word error rate and Tables 18 and 19 give dialect breakdowns.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://papers.nips.cc/paper_files/paper/2025/file/d88714d4f2c1e826d33d6c1eb1497ec9-Paper-Datasets_and_Benchmarks_Track.pdf";
const LANGS = [
  ['bh', 'Bhojpuri', 3], ['bn', 'Bengali', 5], ['ch', 'Chhattisgarhi', 4], ['hi', 'Hindi', 5],
  ['kn', 'Kannada', 5], ['mg', 'Magahi', 4], ['mr', 'Marathi', 4], ['mt', 'Maithili', 4], ['te', 'Telugu', 4],
] as const;
const parts: NonNullable<Leaderboard['parts']> = {
  cer: { name: 'Average CER', unit: '%', better: 'lower' },
  ...Object.fromEntries(LANGS.flatMap(([code, lang, dialects]) => [
    [code + '_CER', { name: lang + ' CER', group: lang, unit: '%', better: 'lower' as const }],
    [code + '_WER', { name: lang + ' WER', group: lang, unit: '%', better: 'lower' as const }],
    ...Array.from({ length: dialects }, (_, idx) => 'D' + (idx + 1)).flatMap(d => [
      [code + '_' + d + '_CER', { name: lang + ' ' + d + ' CER', group: lang, unit: '%', better: 'lower' as const }],
      [code + '_' + d + '_WER', { name: lang + ' ' + d + ' WER', group: lang, unit: '%', better: 'lower' as const }],
    ]),
  ])),
};
const board: Leaderboard = {
  benchmark: "respin-s1", static: 'paper',
  url: "https://papers.nips.cc/paper_files/paper/2025/file/d88714d4f2c1e826d33d6c1eb1497ec9-Paper-Datasets_and_Benchmarks_Track.pdf",
  feed,
  terms: "Tables 18 and 19 report test scores per language and dialect. Keep adapted checkpoints separate from externally trained checkpoints. No score reuse terms found. The paper host returns 404 for robots.txt.",
  parts,
  async fetch() {
    const paper = await pdfText(feed);
    const langs = ['bh','bn','ch','hi','kn','mg','mr','mt','te'];
    const section = paper.split('Table 6: CER and WER (%)')[1]?.split(/\n\s*\n\s*\n/)[0];
    if (!section?.includes('WER (%)') || !section.includes('avg')) throw new Error('Missing RESPIN Table 6');
    let setting = '';
    const rows = [];
    for (const line of section.split('\n')) {
      const group = line.match(/^(Pretrained|Traditional|Fine-tuned) Models/);
      if (group) { setting = group[1]; continue; }
      if (!setting || !line.trim() || !/\d$/.test(line.trim())) continue;
      const [model,...raw] = line.trim().split(/\s+/);
      if (raw.length !== 20 || !raw.every(s => Number.isFinite(Number(s)))) throw new Error('Incomplete Table 6 row for ' + model);
      const metrics: Record<string,number> = { cer:Number(raw[9]) };
      for (const [i,lang] of langs.entries()) for (const [measure,offset] of [['CER',0],['WER',10]] as const) {
        const key = lang + '_' + measure;
        metrics[key] = Number(raw[offset+i]);
      }
      rows.push({ model, setting, score:Number(raw[19]), metrics });
    }
    const dialects = paper.split('Table 18: Dialect-wise')[1]?.split('Table 20:')[0];
    if (!dialects || rows.length < 12) throw new Error('Missing RESPIN results');
    let current: typeof rows[number] | undefined;
    for (const line of dialects.split('\n')) {
      const name = line.match(/^(?:pre-trained )?([\w-]+)\s+\((fine-tuned on non-RESPIN public data|fine-tuned on RESPIN subset|trained from scratch on RESPIN subset)\)/);
      if (name) {
        const group = name[2].includes('non-RESPIN') ? 'Pretrained' : name[2].startsWith('trained') ? 'Traditional' : 'Fine-tuned';
        current = rows.find(r => r.model === name[1].replace(/^IndicW2V2$/, 'IndicW2V') && r.setting === group);
        if (!current) throw new Error('Unknown dialect result for ' + name[1]);
      }
      const d = line.trim().split(/\s+/);
      if (!current || !/^D[1-5]$/.test(d[0])) continue;
      if (d.length !== 19 && d[0] !== 'D5') throw new Error('Incomplete dialect table');
      // A missing dash in the printed D5 row leaves one blank CER cell. Align WER from the right.
      for (const [i,lang] of langs.entries()) for (const [measure,value] of [['CER',d[i+1]],['WER',d[d.length-9+i]]] as const) {
        if (value === '-' || !Number.isFinite(Number(value))) continue;
        const key = lang + '_' + d[0] + '_' + measure;
        current.metrics[key] = Number(value);
      }
    }
    return rows;
  },
};
export default board;
