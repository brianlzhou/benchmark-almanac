// TVQA reports public-test accuracy in percent, separately with and without timestamp localization.
// Keep validation accuracy and TV-series test accuracies as metrics. Exclude human and random references.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const BASE='https://nlp.cs.unc.edu/data/jielei/tvqa/tvqa_public_html/files/';
const board:Leaderboard={benchmark:'tvqa', parts: {
  castle: { name: 'Castle', group: 'TV show' },
  friends: { name: 'Friends', group: 'TV show' },
  house: { name: 'House', group: 'TV show' },
  bbt: { name: 'The Big Bang Theory', group: 'TV show' },
  grey: { name: 'Grey\'s Anatomy', group: 'TV show' },
  himym: { name: 'How I Met Your Mother', group: 'TV show' },
},url:'https://tvqa.cs.unc.edu/',feed:BASE+'leaderboard_data_without_ts.json',terms:'Public UNC TVQA leaderboard data, subject to the dataset and site terms.',stats:{
 validationAccuracy:{name:'Validation accuracy',unit:'%',better:'higher'},
 bbtTestExamples:{name:'The Big Bang Theory test examples',unit:'count'},castleTestExamples:{name:'Castle test examples',unit:'count'},friendsTestExamples:{name:'Friends test examples',unit:'count'},greyTestExamples:{name:"Grey's Anatomy test examples",unit:'count'},himymTestExamples:{name:'How I Met Your Mother test examples',unit:'count'},houseTestExamples:{name:'House test examples',unit:'count'},overallTestExamples:{name:'Overall test examples',unit:'count'},
 bbtValidationAccuracy:{name:'The Big Bang Theory validation accuracy',unit:'%',better:'higher'},castleValidationAccuracy:{name:'Castle validation accuracy',unit:'%',better:'higher'},friendsValidationAccuracy:{name:'Friends validation accuracy',unit:'%',better:'higher'},greyValidationAccuracy:{name:"Grey's Anatomy validation accuracy",unit:'%',better:'higher'},himymValidationAccuracy:{name:'How I Met Your Mother validation accuracy',unit:'%',better:'higher'},houseValidationAccuracy:{name:'House validation accuracy',unit:'%',better:'higher'},
 bbtValidationExamples:{name:'The Big Bang Theory validation examples',unit:'count'},castleValidationExamples:{name:'Castle validation examples',unit:'count'},friendsValidationExamples:{name:'Friends validation examples',unit:'count'},greyValidationExamples:{name:"Grey's Anatomy validation examples",unit:'count'},himymValidationExamples:{name:'How I Met Your Mother validation examples',unit:'count'},houseValidationExamples:{name:'House validation examples',unit:'count'},overallValidationExamples:{name:'Overall validation examples',unit:'count'},
},async fetch(){
  const rows:LeaderboardRow[]=[];
  for(const split of ['without_ts','with_ts']) {
    const {data}=await fetchJson<{data:Array<{model_name:string;test_public_acc:string|number;val_acc:string|number;date?:string;author?:string;institution?:string;val_additional?:Record<string,[number,number]>;test_public_additional?:Record<string,[number,number]>}>}>(BASE+`leaderboard_data_${split}.json`);
    for(const r of data){if(/^(Human Performance|Random)$/.test(r.model_name))continue;
      const score=num(String(r.test_public_acc));if(score===undefined)continue;
      const val=num(String(r.val_acc));const metrics:Record<string,number>={};if(val!==undefined)metrics.validationAccuracy=val;
      for(const [key,value] of Object.entries(r.test_public_additional??{})){
        if(key!=='overall') metrics[key]=value[0];
        if(Number.isFinite(value[1])) metrics[key+'TestExamples']=value[1];
      }
      for(const [key,value] of Object.entries(r.val_additional??{})) {
        if(key!=='overall') metrics[key+'ValidationAccuracy']=value[0];
        if(Number.isFinite(value[1])) metrics[key+'ValidationExamples']=value[1];
      }
      rows.push({model:r.model_name,score,setting:split==='with_ts'?'with timestamp':'without timestamp',date:r.date?.slice(0,10),submitter:r.author,agentOrg:r.institution,metrics});
    }
  }
  if(!rows.length)throw new Error('No TVQA results');return rows;
}};
export default board;
