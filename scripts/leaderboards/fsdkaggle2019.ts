// FSDKaggle2019 tests audio tagging on 80 classes. DCASE reports private and public
// label-weighted label-ranking average precision. Import submissions with documented model identities.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url='https://dcase.community/challenge2019/task-audio-tagging-results';
// The THUEE report identifies both submissions as weighted ensembles of CRNNs and DenseNets.
// The challenge baseline repository identifies its model as MobileNet v1.
const names:Record<string,string>={
  Zhang_THU_task2_1:'CRNN and DenseNet ensemble',Zhang_THU_task2_2:'CRNN and DenseNet ensemble',
  Akiyama_OU_task2_1:'ResNet34 and EnvNet ensemble',Akiyama_OU_task2_2:'ResNet34 and EnvNet ensemble',
  Sun_BNU_task2_1:'CNN+MeanTeacher',Fonseca_UPF_task2_1:'MobileNet v1',
  Zhang_BIsmart_task2_1:'Teacher-Student V1',Zhang_BIsmart_task2_2:'Teacher-Student V2',Zhang_BIsmart_task2_3:'Teacher-Student V3'
};
const board:Leaderboard={
  benchmark:'fsdkaggle2019',url,feed:url,terms:'DCASE publishes the task results and technical reports at '+url+'.',
  parts:{public:'Public leaderboard lwlrap'},
  async fetch(){
    const t=tables(await fetchText(url)).find(t=>t[0]?.map(c=>c.text).join('|')===
      'Rank|Submission code|Kaggle team name|Name|Tech. report|lwlrap (public LB)|lwlrap (private LB*)');
    if(!t) throw new Error('Missing DCASE submission scores');
    const rows=t.slice(1).filter(r=>Object.hasOwn(names,r[1].text)).map(r=>{
      const [,code,team,,,pub,priv]=r.map(c=>c.text);
      if(!team || ![pub,priv].every(v=>/^0\.\d+$|^1\.0+$/.test(v))) throw new Error('Invalid DCASE score');
      return {model:names[code],setting:code,submitter:team,score:Number(priv),metrics:{public:Number(pub)}};
    });
    return checked(rows,9);
  },
};
export default board;
