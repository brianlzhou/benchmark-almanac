// Earnings-21 measures word error rate on recorded earnings calls. The authors'
// transcript README reports full-corpus WER and breaks it down by subset, entity,
// sector and sampling rate. Lower WER is better.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://github.com/revdotcom/speech-datasets/tree/main/earnings21/transcripts';
const feed = 'https://raw.githubusercontent.com/revdotcom/speech-datasets/main/earnings21/transcripts/README.md';
export default {
  benchmark: 'earnings-21', url, feed, terms: 'CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  parts: {
    werEval10:{name:'Eval-10',group:'Evaluation subset',unit:'%',better:'lower'},
    werMeanEntity:{name:'Mean entity WER',group:'Entity type',unit:'%',better:'lower'},
    werABBREVIATION:{name:'Abbreviation WER',group:'Entity type',unit:'%',better:'lower'},
    werALPHANUMERIC:{name:'Alphanumeric WER',group:'Entity type',unit:'%',better:'lower'},
    werCARDINAL:{name:'Cardinal WER',group:'Entity type',unit:'%',better:'lower'},
    werCONTRACTION:{name:'Contraction WER',group:'Entity type',unit:'%',better:'lower'},
    werDATE:{name:'Date WER',group:'Entity type',unit:'%',better:'lower'},
    werEVENT:{name:'Event WER',group:'Entity type',unit:'%',better:'lower'},
    werFAC:{name:'Facility WER',group:'Entity type',unit:'%',better:'lower'},
    werGPE:{name:'Geopolitical entity WER',group:'Entity type',unit:'%',better:'lower'},
    werLANGUAGE:{name:'Language WER',group:'Entity type',unit:'%',better:'lower'},
    werLAW:{name:'Law WER',group:'Entity type',unit:'%',better:'lower'},
    werLOC:{name:'Location WER',group:'Entity type',unit:'%',better:'lower'},
    werMONEY:{name:'Money WER',group:'Entity type',unit:'%',better:'lower'},
    werNORP:{name:'Nationality, religious or political group WER',group:'Entity type',unit:'%',better:'lower'},
    werORDINAL:{name:'Ordinal WER',group:'Entity type',unit:'%',better:'lower'},
    werORG:{name:'Organization WER',group:'Entity type',unit:'%',better:'lower'},
    werPERCENT:{name:'Percentage WER',group:'Entity type',unit:'%',better:'lower'},
    werPERSON:{name:'Person WER',group:'Entity type',unit:'%',better:'lower'},
    werPRODUCT:{name:'Product WER',group:'Entity type',unit:'%',better:'lower'},
    werQUANTITY:{name:'Quantity WER',group:'Entity type',unit:'%',better:'lower'},
    werRANGE:{name:'Range WER',group:'Entity type',unit:'%',better:'lower'},
    werTIME:{name:'Time WER',group:'Entity type',unit:'%',better:'lower'},
    werTWITTER:{name:'Twitter handle WER',group:'Entity type',unit:'%',better:'lower'},
    werWEBSITE:{name:'Website WER',group:'Entity type',unit:'%',better:'lower'},
    werWORKOFART:{name:'Work of art WER',group:'Entity type',unit:'%',better:'lower'},
    werYEAR:{name:'Year WER',group:'Entity type',unit:'%',better:'lower'},
    werMeanSector:{name:'Mean sector WER',group:'Sector',unit:'%',better:'lower'},
    werConglomerates:{name:'Conglomerates WER',group:'Sector',unit:'%',better:'lower'},
    werUtilities:{name:'Utilities WER',group:'Sector',unit:'%',better:'lower'},
    werBasicMaterials:{name:'Basic materials WER',group:'Sector',unit:'%',better:'lower'},
    werServices:{name:'Services WER',group:'Sector',unit:'%',better:'lower'},
    werHealthcare:{name:'Healthcare WER',group:'Sector',unit:'%',better:'lower'},
    werFinancial:{name:'Financial WER',group:'Sector',unit:'%',better:'lower'},
    werConsumerGoods:{name:'Consumer goods WER',group:'Sector',unit:'%',better:'lower'},
    werTechnology:{name:'Technology WER',group:'Sector',unit:'%',better:'lower'},
    werIndustrialGoods:{name:'Industrial goods WER',group:'Sector',unit:'%',better:'lower'},
    werMeanSampleRate:{name:'Mean sample-rate WER',group:'Sample rate',unit:'%',better:'lower'},
    wer44100:{name:'44,100 Hz WER',group:'Sample rate',unit:'%',better:'lower'},
    wer24000:{name:'24,000 Hz WER',group:'Sample rate',unit:'%',better:'lower'},
    wer22050:{name:'22,050 Hz WER',group:'Sample rate',unit:'%',better:'lower'},
    wer16000:{name:'16,000 Hz WER',group:'Sample rate',unit:'%',better:'lower'},
    wer11025:{name:'11,025 Hz WER',group:'Sample rate',unit:'%',better:'lower'},
  } as Record<string,BoardPart>,
  async fetch() {
    const sections = (await fetchText(feed)).split(/^## /m).slice(1);
    let models: string[] = [];
    const values = new Map<string,number[]>();
    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.startsWith('|'));
      if (!lines.length) continue;
      const cells = (line: string) => line.slice(1,-1).split('|').map(c => c.replace(/<br\s*\/?>/gi,' ').replace(/^_|_$/g,'').trim());
      const header = cells(lines[0]).slice(1);
      if (models.length && models.join('|') !== header.join('|')) throw new Error('Inconsistent ASR columns');
      models = header;
      for (const line of lines.slice(2)) {
        const [name,...scores] = cells(line);
        if (scores.length !== models.length || values.has(name)) throw new Error('Invalid WER row: ' + line);
        values.set(name,scores.map(numberCell));
      }
    }
    const full = values.get('Earnings21');
    if (!full || !values.has('Eval-10') || !values.has('Mean Sector') || !values.has('Mean Entity') || !values.has('Mean Sample Rate')) throw new Error('Missing WER sections');
    values.delete('Earnings21');
    const rows = models.map((model,i) => {
      const metrics: Record<string,number> = {};
      for (const [name,valuesByModel] of values) {
        const key = 'wer' + name.replace(/[^a-z0-9]/gi,'');
        if (this.parts) this.parts[key] = {name: /^\d+$/.test(name) ? name + ' Hz' : name, unit: '%', better: 'lower'};
        const value = valuesByModel[i];
        if (value !== undefined) metrics[key] = value;
      }
      return {model, score: full[i], metrics};
    });
    return checked(rows,7);
  },
} satisfies Leaderboard;
