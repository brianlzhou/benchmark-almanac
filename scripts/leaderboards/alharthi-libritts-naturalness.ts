// This listening test scores the naturalness of synthesized LibriTTS speech on a 1 to 5 scale.
// Table 1 of the published paper reports MOS-N on 50 test-clean sentences with ten raters per sample.
// The authors also evaluated test-other but did not include its naturalness scores in the table.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed='https://www.isca-archive.org/syndata4genai_2024/alharthi24_syndata4genai.pdf';
const labels=['WER','SpeechLMScore','MOSNet','MOS-N','MOS-I','Ours 10h','Ours 50h'];
const board:Leaderboard={
  benchmark:'alharthi-libritts-naturalness',static:'paper',url:feed,feed,
  terms:'The publisher provides the paper via the ISCA Archive at https://www.isca-archive.org/syndata4genai_2024/.',
  headline:'Mean listener naturalness rating on LibriTTS test-clean, the split for which the paper publishes scores.',
  parts:Object.fromEntries(labels.map(label=>[label.replace(/[^a-z0-9]/gi,''),{name:label,group:'LibriTTS test-clean',
    unit:label==='WER'?'%':'score',better:label==='WER'||label.startsWith('Ours')?'lower':'higher'}])),
  async fetch(){
    const table=(await pdfText(feed)).split('Table 1: This table shows')[1]?.split('our setting,')[0];
    if (!table?.match(/Ground Truth\s+StyleTTS\s+MQTTS\s+YourTTS/)) throw new Error('Missing model columns');
    const rows=['StyleTTS','MQTTS','YourTTS'].map(model=>({model,score:NaN,metrics:{} as Record<string,number>}));
    for(const label of labels){
      const line=table.split('\n').find(l=>l.trimStart().startsWith(label+' '));
      const values=[...(line??'').matchAll(/(\d+(?:\.\d+)?)\s*\(\d\)/g)].map(m=>Number(m[1]));
      if(values.length!==3) throw new Error('Missing ranked values for '+label);
      rows.forEach((r,i)=>{
        r.metrics[label.replace(/[^a-z0-9]/gi,'')]=values[i];
        if(label==='MOS-N') r.score=values[i];
      });
    }
    return checked(rows,3);
  },
};
export default board;
