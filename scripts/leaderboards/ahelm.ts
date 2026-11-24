// AHELM (audio HELM, Stanford CRFM). The newest run suite's audio_scenarios.json Accuracy table gives "Mean win
// rate", relative to the models on the board, times 100. Read through helmRows in helm-capabilities.ts.
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'audio', kind: 'runs', group: 'audio_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100, scenarioParts: 'raw' };

const board: Leaderboard = {
  benchmark: 'ahelm',
  url: 'https://crfm.stanford.edu/helm/audio/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  parts: {
    'AudioCaps - GPT-4o Judge Critique': { name: 'AudioCaps', group: 'Scenario', unit: 'score', note: 'GPT-4o judge score.' },
    'VoxCeleb2 - EM': { name: 'VoxCeleb2', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
    'VocalSound - PEM': { name: 'VocalSound', group: 'Scenario', unit: 'score', note: 'Prefix exact match from 0 to 1.' },
    'LibriSpeech - WER': { name: 'LibriSpeech', group: 'Scenario', unit: 'score', better: 'lower', note: 'Word error rate, lower is better.' },
    'Multimodal EmotionLines Dataset (MELD) Audio - PEM': { name: 'MELD Audio', group: 'Scenario', unit: 'score', note: 'Prefix exact match from 0 to 1.' },
    'MUStARD - EM': { name: 'MUStARD', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
    'Air-Bench Chat (reasoning subsets) - GPT-4o Judge Critique': { name: 'AIR-Bench Chat reasoning', group: 'Scenario', unit: 'score', note: 'GPT-4o judge score.' },
    'COREBench - PEM': { name: 'COREBench', group: 'Scenario', unit: 'score', note: 'Prefix exact match from 0 to 1.' },
    'Air-Bench Chat (knowledge subsets) - GPT-4o Judge Critique': { name: 'AIR-Bench Chat knowledge', group: 'Scenario', unit: 'score', note: 'GPT-4o judge score.' },
    'Air-Bench Foundation - EM': { name: 'AIR-Bench Foundation', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
    'Robust Speech Bench - WER': { name: 'Robust Speech Bench', group: 'Scenario', unit: 'score', better: 'lower', note: 'Word error rate, lower is better.' },
    'CoVost-2 - BLEU': { name: 'CoVoST-2', group: 'Scenario', unit: 'score', note: 'BLEU translation score.' },
    'FLEURS - WER': { name: 'FLEURS', group: 'Scenario', unit: 'score', better: 'lower', note: 'Word error rate, lower is better.' },
    'Multilingual Librispeech - WER': { name: 'Multilingual LibriSpeech', group: 'Scenario', unit: 'score', better: 'lower', note: 'Word error rate, lower is better.' },
    'MuTox - EM': { name: 'MuTox', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
    'Voice Jailbreak Attacks Against GPT-4o - Refusal rate for safety': { name: 'Voice Jailbreak refusal', group: 'Scenario', unit: 'score', note: 'Safety refusal rate from 0 to 1.' },
    'FLEURS Fairness - WER': { name: 'FLEURS Fairness', group: 'Scenario', unit: 'score', better: 'lower', note: 'Word error rate, lower is better.' },
    'LibriSpeech Fairness - WER': { name: 'LibriSpeech Fairness', group: 'Scenario', unit: 'score', better: 'lower', note: 'Word error rate, lower is better.' },
    'PARADE - EM': { name: 'PARADE', group: 'Scenario', unit: 'score', note: 'Exact match from 0 to 1.' },
  },
  fetch: () => helmRows(TABLE),
};
export default board;
