// Archived official OmniAI page and original CDN chart labels, transcribed 2026-11-10.
// Costs are per 1,000 pages, not per benchmark document. Global average tokens are not model-specific.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
const ROWS: LeaderboardRow[] = [
  {
    "model": "OmniAI (OCR service)",
    "score": 91.7,
    "metrics": {
      "costPerThousandPages": 10,
      "latency": 9.69
    }
  },
  {
    "model": "Gemini 2.0 Flash (snapshot unspecified)",
    "score": 86.1,
    "metrics": {
      "costPerThousandPages": 1.12,
      "latency": 10.71
    }
  },
  {
    "model": "Azure (OCR service)",
    "score": 85.1,
    "metrics": {
      "costPerThousandPages": 10,
      "latency": 4.4
    }
  },
  {
    "model": "Llama 4 Maverick",
    "score": 82.3,
    "metrics": {
      "costPerThousandPages": 1.98,
      "latency": 22.05
    }
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 75.5,
    "metrics": {
      "costPerThousandPages": 18.37,
      "latency": 24.85
    }
  },
  {
    "model": "Qwen 2.5 VL 72b",
    "score": 75.2
  },
  {
    "model": "AWS Textract (OCR service)",
    "score": 74.3,
    "metrics": {
      "costPerThousandPages": 4,
      "latency": 4.86
    }
  },
  {
    "model": "Mistral OCR (snapshot unspecified)",
    "score": 72.2,
    "metrics": {
      "costPerThousandPages": 1,
      "latency": 5.42
    }
  },
  {
    "model": "Claude Sonnet 3.5 (snapshot unspecified)",
    "score": 69.3,
    "metrics": {
      "costPerThousandPages": 19.93,
      "latency": 18.42
    }
  },
  {
    "model": "Google Document AI (OCR service)",
    "score": 67.8,
    "metrics": {
      "costPerThousandPages": 1.5,
      "latency": 3.19
    }
  },
  {
    "model": "GPT-4o Mini (snapshot unspecified)",
    "score": 64.8,
    "metrics": {
      "costPerThousandPages": 0.97,
      "latency": 22.73
    }
  },
  {
    "model": "Llama 3.2 90b",
    "score": 54.2
  },
  {
    "model": "Unstructured (OCR service)",
    "score": 50.8,
    "metrics": {
      "costPerThousandPages": 20,
      "latency": 7.99
    }
  },
  {
    "model": "Gemma-3 27b",
    "score": 42.9
  }
];
const SOURCES = [["https://framerusercontent.com/images/eDrtZeseTAW1PlgUnHGBmHHdNIc.png", "0e398c55c77529d9106f1ca120855e3f0c2295998cbdb3d34134a069ab69541a"], ["https://framerusercontent.com/images/0r5y8c29WMw1j5xElh7cgaTRs3Q.png", "b8b6fdd5f1eb64bf226095bc61689a2bdae6898f971e3f0d6641b8caa7367cc0"], ["https://framerusercontent.com/images/lx892NKgxgzFGf9FbXiV14eBTKg.png", "3def481060245e04d393fa3ec1176b4e7575913ffc5ba38eea80480a546ba48a"]];
const board: Leaderboard={benchmark:'omniai-ocr-benchmark',url:'https://web.archive.org/web/20251212084646/https://getomni.ai/blog/ocr-benchmark',feed:SOURCES.map(s=>s[0]).join('; '),terms:'Official public comparison charts, credited to OmniAI with an archived source link.',aliases:{'Qwen 2.5 VL 72b':'qwen2-5-vl-72b','Gemma-3 27b':'gemma-3-27b','Llama 3.2 90b':'llama-3-2-90b'},chart:{title:'JSON accuracy versus page cost',x:{key:'costPerThousandPages',label:'Cost per 1,000 pages',unit:'$',better:'lower'},y:{key:'score',label:'JSON accuracy',unit:'%',better:'higher'}},async fetch(){for(const [url,hash] of SOURCES)await checkedImageRows(url,hash,ROWS);return ROWS;}};
export default board;
