// TRUE tests text recognition and understanding in images. FlagEval publishes an All score and seven task scores in the project page's results table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://flageval-baai.github.io/TRUE/";

const board: Leaderboard = {
  benchmark: "true-flageval",
  url: "https://flageval-baai.github.io/TRUE/",
  feed,
  terms: "The publisher displays results at https://flageval-baai.github.io/TRUE/. I could not verify reuse terms. GitHub Pages returns 404 for robots.txt.",
  parts: Object.fromEntries(['HW','SceneOCR','FakeBrands','BookVQA','DietVQA','Chart&Info','SceneVQA'].map(k => [k,k])),
  aliases: {
    "gemini-2.5-pro-preview-03-25": "gemini-2-5-pro-mar-2025",
    "gemini-2.0-flash-exp": "gemini-2-0-flash-dec-2024",
    "Pixtral-Large-Instruct-2411": "pixtral-large",
    "Pixtral-12B-2409": "pixtral-12b",
    "Mistral-Small-3.1-24B": "mistral-small-3-1",
    "Meta-Llama-3.2-90B-Vision": "llama-3-2-90b",
    "Meta-Llama-3.2-11B-Vision": "llama-3-2-11b",
    "llava-onevision-qwen2-72b": "llava-onevision-72b",
    "llava-onevision-qwen2-7b": "llava-onevision-7b",
  },
  async fetch() {
    const keys = Object.keys(board.parts!);
    const t = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === ['Model','All',...keys].join('|'));
    if (!t || t.length < 24) throw new Error('Missing TRUE rankings');
    return t.slice(1).map(c => {
      const values = c.slice(1).map(v => num(v.text));
      if (!c[0].text || values.length !== 8 || values.some(v => v === undefined)) throw new Error('Missing TRUE score');
      return {model:c[0].text, score:values[0]!, metrics:Object.fromEntries(keys.map((k,i) => [k,values[i+1]!]))};
    });
  },
};

export default board;
