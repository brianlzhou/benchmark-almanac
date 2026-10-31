import taxonomyJson from '../../data/taxonomy.json';

// Fine categories group into eight areas. Areas drive navigation and the stacked charts, so there are
// never more of them than the categorical palette has hues.

export interface Area {
  id: string;
  name: string;
  question: string;
  categories: string[];
}

export const AREAS: Area[] = [
  {
    id: 'knowledge',
    name: 'Knowledge and language',
    question: 'What does the model know, and how well does it read and write?',
    categories: ['knowledge-qa', 'factuality-hallucination', 'multilingual', 'long-context', 'instruction-following-chat', 'writing-creative-taste'],
  },
  {
    id: 'reasoning',
    name: 'Math and science',
    question: 'Can it solve problems that experts find hard?',
    categories: ['math', 'science-reasoning', 'forecasting'],
  },
  {
    id: 'code',
    name: 'Coding',
    question: 'Can it write and fix real software?',
    categories: ['coding', 'ai-rnd-rsi'],
  },
  {
    id: 'agents',
    name: 'Agents and tools',
    question: 'Can it act on its own in a terminal, a browser or a game?',
    categories: ['agentic-terminal', 'computer-use-browser', 'tool-use', 'games-long-horizon'],
  },
  {
    id: 'work',
    name: 'Professional work',
    question: 'Can it do the work people are paid for?',
    categories: ['economic-work', 'domain-legal-finance-medical', 'engineering-design'],
  },
  {
    id: 'multimodal',
    name: 'Vision, audio and robotics',
    question: 'Can it see, hear and act in the world?',
    categories: ['multimodal-vision', 'audio-video', 'robotics-embodied', 'world-models'],
  },
  {
    id: 'safety',
    name: 'Safety and security',
    question: 'What harm could it do, and does it refuse?',
    categories: ['safety-alignment', 'cyber', 'bio-chem'],
  },
  {
    id: 'other',
    name: 'Other',
    question: 'Tests that fit nowhere else.',
    categories: ['other'],
  },
];

export const CATEGORY_NAMES: Record<string, string> = {
  'knowledge-qa': 'Knowledge',
  'factuality-hallucination': 'Factuality',
  multilingual: 'Multilingual',
  'long-context': 'Long context',
  'instruction-following-chat': 'Instructions and chat',
  'writing-creative-taste': 'Writing and taste',
  math: 'Math',
  'science-reasoning': 'Science and reasoning',
  forecasting: 'Forecasting',
  coding: 'Coding',
  'ai-rnd-rsi': 'AI research',
  'agentic-terminal': 'Terminal agents',
  'computer-use-browser': 'Computer and browser use',
  'tool-use': 'Tool use',
  'games-long-horizon': 'Games and long tasks',
  'economic-work': 'Economic work',
  'domain-legal-finance-medical': 'Law, finance and medicine',
  'engineering-design': 'Engineering and CAD',
  'multimodal-vision': 'Vision',
  'audio-video': 'Audio and video',
  'robotics-embodied': 'Robotics',
  'world-models': 'World models',
  'safety-alignment': 'Safety and alignment',
  cyber: 'Cybersecurity',
  'bio-chem': 'Biology and chemistry',
  other: 'Other',
  'meta-collection': 'Collections',
  methodology: 'Methodology',
};

const AREA_OF = new Map<string, string>();
for (const a of AREAS) for (const c of a.categories) AREA_OF.set(c, a.id);

export function areaOf(category: string | undefined): string {
  return (category && AREA_OF.get(category)) || 'other';
}

export const AREA_BY_ID = new Map(AREAS.map((a) => [a.id, a]));

// ---- finer categories, levels, scoring methods and formats (data/taxonomy.json) --------------------

export interface Level {
  id: string;
  name: string;
  who: string;
  examples: string[];
}
export interface Method {
  id: string;
  name: string;
  how: string;
}
export interface Named {
  id: string;
  name: string;
  note?: string;
}

const tax = taxonomyJson as { levels: Level[]; scoring: Method[]; formats: Named[]; subcategories: Record<string, Named[]> };
export const LEVELS = tax.levels;
export const SCORING = tax.scoring;
export const FORMATS = tax.formats;
export const SUBCATEGORIES = tax.subcategories;
export const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]));
export const SCORING_BY_ID = new Map(SCORING.map((s) => [s.id, s]));
export const FORMAT_BY_ID = new Map(FORMATS.map((f) => [f.id, f]));
export const SUB_BY_ID = new Map(Object.values(SUBCATEGORIES).flat().map((s) => [s.id, s]));
export const levelIndex = (id: string | undefined) => (id ? LEVELS.findIndex((l) => l.id === id) : -1);

/** Arenas and matches rank models against each other. Everything else scores against a fixed standard. */
export const RANKED_BY_PEOPLE_OR_MATCHES = new Set(['preference', 'head-to-head']);
