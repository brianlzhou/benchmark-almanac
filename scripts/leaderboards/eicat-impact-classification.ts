// EICAT impact classification tests ecological impact labels from scientific full texts.
// Table 1 reports macro and micro F1 for three model families and sentence selectors.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://aclanthology.org/2025.nlp4ecology-1.20.pdf';
const board:Leaderboard={benchmark:'eicat-impact-classification',url:'https://aclanthology.org/2025.nlp4ecology-1.20/',feed,static:'paper',parts:{microF1:'Micro F1'},terms:'ACL Anthology papers are available under the terms at https://aclanthology.org/faq/copyright/.',async fetch(){
 const p=await pdfText(feed); if(!p.includes('Table 1: Results on the EICAT dataset')) throw new Error('Missing EICAT Table 1');
 const vals=[['ModernBERT','Complete Input',.433,.446],['ModernBERT','Complete Input randomized',.439,.465],['PubMedBERT','Complete Input',.425,.446],['PubMedBERT','Evidence',.523,.538],['PubMedBERT','Evidence randomized',.503,.508],['PubMedBERT','LLM',.457,.460],['PubMedBERT','LLM randomized',.494,.508],['PubMedBERT','Entropy',.453,.460],['PubMedBERT','Entropy randomized',.475,.494],['PubMedBERT','Importance',.442,.460],['PubMedBERT','Importance randomized',.479,.479],['PubMedBERT','Random',.441,.450],['PubMedBERT','Random randomized',.496,.499],['Llama 3.1 8B','Complete Input',.272,.373],['Llama 3.1 8B','Evidence',.234,.237],['Llama 3.1 8B','Evidence randomized',.257,.271],['Llama 3.1 8B','LLM',.228,.271],['Llama 3.1 8B','LLM randomized',.230,.305],['Llama 3.1 8B','Entropy',.322,.373],['Llama 3.1 8B','Entropy randomized',.358,.441],['Llama 3.1 8B','Importance',.403,.441],['Llama 3.1 8B','Importance randomized',.399,.441],['Llama 3.1 8B','Random',.265,.339],['Llama 3.1 8B','Random randomized',.356,.407]] as const;
 return checked(vals.map(([model,setting,score,microF1])=>({model,setting,score:score*100,metrics:{microF1:microF1*100}})),24);
}}; export default board;
