// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// 3LM tests Arabic STEM reasoning and code generation. Tables 1 and 2 list native and synthetic MCQ accuracy
// before completion accuracy. Tables 4 and 12 give average Arabic code pass@1 beside the four individual tests.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.arabicnlp-main.4.pdf';
const families: [string,number][][] = [
  [['Qwen2.5',4],['jais-adapted',2],['jais-family-8k',1],['Fanar-1',1],['Llama-3.1',2],
   ['AceGPT-v2',3],['Qwen3-Base',4],['gemma-3-pt',3]],
  [['Qwen2.5-Instruct',4],['jais-adapted-chat',2],['jais-chat-v3',1],['SILMA-Instruct-v1.0',1],
   ['Fanar-1-Instruct',1],['Llama-3.1-Instruct',1],['Llama-3.3-Instruct',1],['AceGPT-v2-Chat',3],
   ['aya-expanse',2],['c4ai-command-r7',1],['ALLaM-Instruct-preview',1],['Yehia-preview',1],['Qwen3',6],['gemma-3-it',3]],
];
const stemKeys = ['nativeMCQ','nativeCompletion','syntheticMCQ','syntheticCompletion'];
const codeKeys = ['enHumanEval','enHumanEvalPlus','enMBPP','enMBPPPlus','arHumanEval','arHumanEvalPlus','arMBPP','arMBPPPlus','enAvg','arAvg'];
const labels = ['Native MCQ','Native completion','Synthetic MCQ','Synthetic completion','English HumanEval','English HumanEval+',
  'English MBPP','English MBPP+','Arabic HumanEval','Arabic HumanEval+','Arabic MBPP','Arabic MBPP+','English code average','Arabic code average'];
function readRows(table:string,n:number) {
  const re = new RegExp('\\b(\\d+B(?:-A\\d+B)?)\\s+((?:[\\d.]+[ \\t]+){'+(n-1)+'}[\\d.]+)[ \\t]*$');
  return table.split('\n').flatMap(line=>{
    const m=line.trimEnd().match(re);
    return m ? [{size:m[1],values:m[2].trim().split(/\s+/).map(Number)}] : [];
  });
}
const board:Leaderboard = {
  benchmark:'3lm',static:'paper',url:'https://aclanthology.org/2025.arabicnlp-main.4/',feed,
  aliases:{
    'Qwen3-Base 4B':'qwen3-4b-base',
    'Qwen3-Base 8B':'qwen3-8b-base',
    'Qwen3-Base 14B':'qwen3-14b-base',
    'Qwen3-Base 30B-A3B':'qwen3-30b-a3b-base',
    'gemma-3-pt 4B':'gemma-3-4b-pt',
    'gemma-3-pt 12B':'gemma-3-12b-pt',
    'gemma-3-pt 27B':'gemma-3-27b-pt',
    'gemma-3-it 4B':'gemma-3-4b',
    'gemma-3-it 12B':'gemma-3-12b',
    'gemma-3-it 27B':'gemma-3-27b',
    'Llama-3.3-Instruct 70B':'llama-3-3-70b-instruct',
  },
  terms:'The ACL Anthology publishes the paper under its terms at https://aclanthology.org/faq/.',
  headline:'The paper gives no suite-wide score, so this is the plain mean of native MCQ accuracy, synthetic MCQ accuracy and Arabic code pass@1.',
  parts:Object.fromEntries([...stemKeys,...codeKeys].map((k,i)=>[k,{name:labels[i],unit:'%'}])),
  async fetch() {
    const pdf=await pdfText(feed);
    const before=pdf.split('Table 1: Average accuracy')[0].split('\f').at(-1)!;
    if (!before.includes('Synthetic') || !before.includes('Completion')) throw new Error('Missing STEM columns');
    const rows:LeaderboardRow[]=[];
    for (const i of [0,1]) {
      const side=before.split('\n').map(line=>i===0 ? line.slice(0,74) : line.slice(74)).join('\n');
      const end=pdf.indexOf('Table '+(i===0?4:12)+':');
      const start=pdf.lastIndexOf('HumanEval+',end);
      if (start<0 || !pdf.slice(start,start+120).includes('Arabic')) throw new Error('Missing EvalPlus columns');
      const stem=readRows(side,4),code=readRows(pdf.slice(start,end),10);
      const names=families[i].flatMap(([name,count])=>Array<string>(count).fill(name));
      if (names.length!==stem.length || names.length!==code.length) throw new Error('Model counts changed');
      names.forEach((family,j)=>{
        if (!side.includes(family) || stem[j].size !== code[j].size.replace(i===0?'30B-A3B':'__','30B')) throw new Error('Model identity mismatch: '+family);
        const values=[...stem[j].values,...code[j].values];
        if (!values.every(Number.isFinite)) throw new Error('Missing suite value');
        const metrics=Object.fromEntries([...stemKeys,...codeKeys].map((k,n)=>[k,values[n]]));
        rows.push({model:family+' '+code[j].size,score:(metrics.nativeMCQ+metrics.syntheticMCQ+metrics.arAvg)/3,metrics});
      });
    }
    return checked(rows,48);
  },
};
export default board;
