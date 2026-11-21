// ContractNLI tests evidence identification and entailment or contradiction classification in contracts.
// Table 3 reports eight named backbone and fine-tuning configurations.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2021.findings-emnlp.164.pdf';
const board:Leaderboard={benchmark:'contractnli',url:'https://aclanthology.org/2021.findings-emnlp.164/',feed,static:'paper',parts:{evidenceMap:'Evidence mAP',evidencePAtR80:'Evidence P@R80',nliAccuracy:'NLI accuracy',f1Contradiction:'NLI F1 contradiction',f1Entailment:'NLI F1 entailment'},terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 3: Results for different backbone')) throw new Error('Missing ContractNLI Table 3');
 const vals=[['BERTbase',.885,.663,.838,.287,.765],['BERTlarge',.922,.793,.875,.357,.834],['DeBERTa v2xlarge',.933,.859,.885,.360,.855],['BERTbase case law',.870,.578,.831,.289,.783],['BERTbase case law and contract',.925,.811,.794,.272,.746],['DeBERTa v2xlarge span identification',.936,.860,.892,.405,.859],['BERTbase NDAs',.892,.690,.864,.326,.820],['BERTlarge NDAs',.922,.837,.875,.389,.839]] as const;
 return checked(vals.map(([model,map,p80,acc,fc,fe])=>({model,score:acc*100,metrics:{evidenceMap:map*100,evidencePAtR80:p80*100,f1Contradiction:fc*100,f1Entailment:fe*100}})),8);
}}; export default board;
