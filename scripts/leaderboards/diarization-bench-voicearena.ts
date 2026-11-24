// Voice Arena ranks systems by duration-weighted diarization error rate. Its public data bundle includes three collar settings and a corrected Nemotron aggregate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://voicearena.com/assets/diarization-uRu63AZp.js";
interface System {id:string;name:string;variant:string;type:number}
interface Summary {der:number[];jer:number[];missed:number;falseAlarm:number;confusion:number}

const board: Leaderboard = {
  stats: { jer: { name: 'Jaccard error rate', unit: '%', better: 'lower' }, missed: { name: 'Missed speech', unit: '%', better: 'lower' }, falseAlarm: { name: 'False alarm speech', unit: '%', better: 'lower' }, confusion: { name: 'Speaker confusion', unit: '%', better: 'lower' }, countCorrect: { name: 'Correct speaker count', unit: '%', better: 'higher' } },
  benchmark: "diarization-bench-voicearena",
  url: "https://voicearena.com/diarization-bench",
  feed,
  terms: "Voice Arena links its site terms. https://voicearena.com/terms The robots file lists crawler-specific rules. The importer reads the public data asset.",
  async fetch(){
    const source=await fetchText(feed);
    const read=<T>(marker:string):T=>{
      const at=source.indexOf(marker);
      if(at<0) throw new Error('Missing published data '+marker);
      const raw=source.slice(at+marker.length).replace(/([,:\[])(-?)\.(\d)/g,'$1$20.$3').replaceAll(':!0',':true');
      return jsLiteral<T>(raw,0);
    };
    const systems=read<System[]>('const g='),sessions=read<number[][]>(',c='),runs=read<number[][][]>(',x=');
    const correction=read<{all:Summary}>(',P=').all, excluded=read<string[]>(',w=new Set(');
    const meta=read<Record<string,{type:string;licence?:string;mode:string}>>(',z=');
    const rows:LeaderboardRow[]=[];
    systems.forEach((sys,i)=>{
      if(excluded.includes(sys.id)) return;
      const run=runs[i];if(!run?.length) throw new Error('Missing sessions for '+sys.name);
      const minutes=run.reduce((s,r)=>s+sessions[r[0]][1],0);
      const mean=(k:number)=>run.reduce((s,r)=>s+r[k]*sessions[r[0]][1],0)/minutes;
      const corrected=sys.id==='nemotron_offline'?correction:undefined;
      const stats={missed:corrected?.missed??mean(8),falseAlarm:corrected?.falseAlarm??mean(9),confusion:corrected?.confusion??mean(10),
        countCorrect:100*run.filter(r=>r[1]===sessions[r[0]][2]).length/run.length};
      [0,100,250].forEach((ms,k)=>{
        const score=corrected?.der[k]??mean(2+k),jer=corrected?.jer[k]??mean(5+k);
        if(!sys.name || ![score,jer,...Object.values(stats)].every(Number.isFinite)) throw new Error('Invalid diarization metrics');
        rows.push({model:sys.name,setting:[sys.type===1?'Diarization only':'With ASR',ms+' ms collar',sys.variant,meta[sys.id].mode].join(' / '),
          open:meta[sys.id].type==='open',license:meta[sys.id].licence,score,metrics:{jer,...stats}});
      });
    });
    if(rows.length<45) throw new Error('Missing public diarization settings');
    return rows;
  },
};
export default board;
