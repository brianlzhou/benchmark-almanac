// The Open Japanese LLM Leaderboard sorts runs by AVG on its native zero-to-one scale. The dataset viewer serves the same training split as the Space.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://datasets-server.huggingface.co/rows?dataset=llm-jp%2Fleaderboard-contents&config=default&split=train";
const tasks = {
  "NLI": "AVG (NLI)",
  "QA": "AVG (QA)",
  "RC": "AVG (RC)",
  "MC": "AVG (MC)",
  "EL": "AVG (EL)",
  "FA": "AVG (FA)",
  "MR": "AVG (MR)",
  "MT": "AVG (MT)",
  "HE": "AVG (HE)",
  "CG": "AVG (CG)",
  "SUM": "AVG (SUM)",
  "alt-e-to-j_bert_score_ja_f1": "ALT E to J BERT Score",
  "alt-e-to-j_bleu_ja": "ALT E to J BLEU",
  "alt-e-to-j_comet_wmt22": "ALT E to J COMET WMT22 ⭐",
  "alt-j-to-e_bert_score_en_f1": "ALT J to E BERT Score",
  "alt-j-to-e_bleu_en": "ALT J to E BLEU",
  "alt-j-to-e_comet_wmt22": "ALT J to E COMET WMT22 ⭐",
  "chabsa_set_f1": "ChABSA ⭐",
  "commonsensemoralja_exact_match": "CommonSenseMoralJA ⭐",
  "jamp_exact_match": "JAMP ⭐",
  "janli_exact_match": "JANLI ⭐",
  "jcommonsenseqa_exact_match": "JCommonSenseQA ⭐",
  "jemhopqa_char_f1": "JEMHopQA ⭐",
  "jmmlu_exact_match": "JMMLU ⭐",
  "jnli_exact_match": "JNLI ⭐",
  "jsem_exact_match": "JSEM ⭐",
  "jsick_exact_match": "JSICK ⭐",
  "jsquad_char_f1": "JSquad ⭐",
  "jsts_pearson": "JSTS (Pearson)",
  "jsts_spearman": "JSTS (Spearman)",
  "kuci_exact_match": "KUCI ⭐",
  "mawps_exact_match": "MAWPS ⭐",
  "mbpp_code_exec": "MBPP (exec) (0 shots only) ⭐",
  "mbpp_pylint_check": "MBPP (pylint) (0 shots only)",
  "mmlu_en_exact_match": "MMLU ⭐",
  "niilc_char_f1": "NIILC ⭐",
  "aio_char_f1": "JAQKET ⭐",
  "wiki_coreference_set_f1": "Wiki Coreference ⭐",
  "wiki_dependency_set_f1": "Wiki Dependency ⭐",
  "wiki_ner_set_f1": "Wiki NER ⭐",
  "wiki_pas_set_f1": "Wiki PAS ⭐",
  "wiki_reading_char_f1": "Wiki Reading ⭐",
  "wikicorpus-e-to-j_bert_score_ja_f1": "WikiCorpus E to J BERT Score",
  "wikicorpus-e-to-j_bleu_ja": "WikiCorpus E to J BLEU",
  "wikicorpus-e-to-j_comet_wmt22": "WikiCorpus E to J COMET WMT22 ⭐",
  "wikicorpus-j-to-e_bert_score_en_f1": "WikiCorpus J to E BERT Score",
  "wikicorpus-j-to-e_bleu_en": "WikiCorpus J to E BLEU",
  "wikicorpus-j-to-e_comet_wmt22": "WikiCorpus J to E COMET WMT22 ⭐",
  "xlsum_ja_bert_score_ja_f1": "XL-Sum JA BERT Score (0 shots only)",
  "xlsum_ja_bleu_ja": "XL-Sum JA BLEU (0 shots only)",
  "xlsum_ja_rouge1": "XL-Sum ROUGE1 (0 shots only)",
  "xlsum_ja_rouge2": "XL-Sum ROUGE2 (0 shots only) ⭐",
  "xlsum_ja_rouge2_scaling": "XL-Sum JA ROUGE2 Scaling",
  "xlsum_ja_rougeLsum": "XL-Sum ROUGE-Lsum (0 shots only)"
};
interface Result {model:string;AVG:number;num_few_shot:number;revision:string;precision:string;llm_jp_eval_version:string;vllm_version:string;license:string;params:number;[key:string]:unknown}

const board: Leaderboard = {
  benchmark: "open-japanese-llm-leaderboard",
  url: "https://huggingface.co/spaces/llm-jp/open-japanese-llm-leaderboard",
  feed,
  terms: "See the publisher’s Space and each upstream dataset license at https://huggingface.co/spaces/llm-jp/open-japanese-llm-leaderboard Hugging Face allows crawling.",
  parts:tasks,
  async fetch() {
    const rows:LeaderboardRow[]=[];
    let total=0;
    do {
      const offset=rows.length;
      if(offset) await new Promise(resolve=>setTimeout(resolve,1000));
      const page=await fetchJson<{num_rows_total:number;rows:{row:Result;row_idx:number}[]}>(feed+'&offset='+offset+'&length=100');
      total=page.num_rows_total;
      if(!page.rows.length || total<862 || page.rows[0].row_idx!==offset) throw new Error('Incomplete dataset page');
      for(const {row:r} of page.rows){
        if(!r.model || !Number.isFinite(r.AVG)) throw new Error('Missing model or AVG');
        const metrics:Record<string,number>={};
        for(const [key,label] of Object.entries(tasks)){
          const v=r[key];
          if(typeof v!=='number') throw new Error('Missing '+label);
          metrics[key]=/bleu_|xlsum_ja_rouge(1|2|Lsum)$/.test(key)?v/100:v;
        }
        rows.push({model:r.model,score:r.AVG,metrics,params:r.params,license:r.license,link:'https://huggingface.co/'+r.model,
          harness:'llm-jp-eval '+r.llm_jp_eval_version,setting:[r.num_few_shot+'-shot',r.precision,r.revision,'vLLM '+r.vllm_version].join(' / ')});
      }
    } while(rows.length<total);
    if(rows.length!==total) throw new Error('Dataset row count changed');
    return rows;
  },
};
export default board;
