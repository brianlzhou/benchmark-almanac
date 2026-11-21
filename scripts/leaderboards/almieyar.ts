// Almieyar evaluates speech recognition in 17 Arabic dialects. Table 2 reports the overall word error rate.
// Tables 2 to 4 add character and match error rates, six dialect families and individual dialects.
import type { Leaderboard } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,flatPaperTables,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2609.35564';
const families = ['Gulf','Levantine','Maghrebi','Iraqi','Egyptian','Sudanese','Overall'];
const dialects = ['Bahraini','Omani','Qatari','Saudi','Yemeni','Jordanian','Lebanese','Palestinian','Syrian',
  'Algerian','Libyan','Moroccan','Tunisian','Ahwazi','Iraqi Arabic'];
const identifiers = ['Voxtral-Mini-4B','Fanar-STT-LF','Whisper-Large-v3','SeamlessM4T-v2','Whisper-Medium',
  'Whisper-Small','Moonshine-AR','Wav2Vec2-53-AR','Wav2Vec2-XLSR-AR','Wav2Vec2-XLSR-v2','Sinai-STT'];
const abbreviations = ['Vox','Fan','W-L','Sea','W-M','W-S','Moo','W53','XLS','XLv2','Sin'];
const partNames = [...families.flatMap(f=>['WER','CER','MER'].map(m=>f+' '+m)), ...dialects.flatMap(d=>[d+' WER',d+' CER'])];
function rate(s:string) {
  if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Missing error rate: '+s);
  return Number(s);
}
const board: Leaderboard = {
  benchmark:'almieyar',url:feed,feed,static:'paper',terms:PAPER_TERMS,
  parts:Object.fromEntries(partNames.map(name=>[name,{name,unit:'%' as const,better:'lower' as const}])),
  async fetch() {
    const ts = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = ts.find(t=>t[0][1]==='WER (%)' && t[1]?.join('|')==='Model|Gulf|Lev.|Mag.|Iraqi|Egy.|Sud.|Ovr.|Gulf|Lev.|Mag.|Iraqi|Egy.|Sud.|Ovr.');
    const mer = ts.find(t=>t[0].join('|')==='Model|Gulf|Lev.|Mag.|Irq.|Egy.|Sud.|Ovr.');
    const groups = ts.find(t=>t[1]?.join('|')===['Dialect',...abbreviations,...abbreviations].join('|'));
    if (!main || !mer || !groups) throw new Error('Missing Almieyar results columns');
    return checked(main.slice(2).map(([model,...cells])=>{
      const metrics:Record<string,number> = {};
      const match = mer.find(r=>r[0]===model);
      families.forEach((f,i)=>{
        metrics[f+' WER'] = rate(cells[i]);
        metrics[f+' CER'] = rate(cells[i+7]);
        if (match) metrics[f+' MER'] = rate(match[i+1]);
      });
      if (model!=='GPT-4o-transcribe') {
        const i = identifiers.indexOf(model);
        if (!match || i<0) throw new Error('Missing model breakdown: '+model);
        for (const d of dialects) {
          const row = groups.find(r=>r[0]===d);
          if (!row) throw new Error('Missing dialect '+d);
          metrics[d+' WER'] = rate(row[i+1]);
          metrics[d+' CER'] = rate(row[i+1+identifiers.length]);
        }
      }
      return {model,setting:'Zero-shot',score:metrics['Overall WER'],metrics};
    }),12);
  },
};
export default board;
