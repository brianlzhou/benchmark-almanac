// Arena's categories: the ratings it fits on the votes for one kind of prompt, such as coding, a language or an
// industry. The Arena importers keep each one as a metric on the model's overall row ("cat:coding", see
// scripts/leaderboards/lmarena-elo.ts). Arena tags each battle with every category its prompt fits, so one vote
// counts in several, and the categories are views of one arena rather than arenas of their own. The benchmark page
// shows them in a category switch (src/components/ArenaCategories.astro).
import { leaderboardScores } from './data.ts';
import type { Score } from './types.ts';

export type CatGroup = 'Task' | 'Language' | 'Industry' | 'Method';
export const CAT_GROUPS: CatGroup[] = ['Task', 'Language', 'Industry', 'Method'];

// Arena's category ids and the names we show, in the order the switch lists them
const NAMES: [string, string][] = [
  // text
  ['coding', 'Coding'],
  ['math', 'Math'],
  ['creative_writing', 'Creative writing'],
  ['instruction_following', 'Instruction following'],
  ['hard_prompts', 'Hard prompts'],
  ['hard_prompts_english', 'Hard prompts in English'],
  ['longer_query', 'Longer queries'],
  ['multi_turn', 'Multi-turn'],
  ['expert', 'Expert'],
  // vision
  ['homework', 'Homework'],
  ['diagram', 'Diagrams'],
  ['ocr', 'Text in images'],
  ['captioning', 'Captioning'],
  ['entity_recognition', 'Entity recognition'],
  ['humor', 'Humor'],
  ['creative_writing_vision', 'Creative writing about images'],
  // text to image
  ['photorealistic', 'Photorealistic'],
  ['portraits', 'Portraits'],
  ['art', 'Art'],
  ['cartoon', 'Cartoon'],
  ['3d_modeling', '3D modeling'],
  ['commercial_design', 'Commercial design'],
  ['text_rendering', 'Text rendering'],
  ['agentic', 'Agentic'],
  // image edit
  ['multi_image_edit', 'Several images'],
  ['multi_image_edit_agentic', 'Agentic with several images'],
  // code
  ['webdev-html', 'HTML'],
  ['webdev-react', 'React'],
  // languages
  ['english', 'English'],
  ['non_english', 'Not English'],
  ['chinese', 'Chinese'],
  ['french', 'French'],
  ['german', 'German'],
  ['japanese', 'Japanese'],
  ['korean', 'Korean'],
  ['polish', 'Polish'],
  ['russian', 'Russian'],
  ['spanish', 'Spanish'],
  // industries
  ['industry_software_and_it_services', 'Software and IT'],
  ['industry_mathematical', 'Mathematics'],
  ['industry_life_and_physical_and_social_science', 'Science'],
  ['industry_medicine_and_healthcare', 'Medicine and healthcare'],
  ['industry_business_and_management_and_financial_operations', 'Business and finance'],
  ['industry_legal_and_government', 'Law and government'],
  ['industry_writing_and_literature_and_language', 'Writing and literature'],
  ['industry_entertainment_and_sports_and_media', 'Entertainment, sports and media'],
  // other ways to rank the same votes
  ['exclude_ties', 'Ties left out'],
  ['factuality', 'Factuality weighted'],
];
const ORDER = new Map(NAMES.map(([k], i) => [k, i]));
const NAME = new Map(NAMES);
const LANGUAGES = new Set(['english', 'non_english', 'chinese', 'french', 'german', 'japanese', 'korean', 'polish', 'russian', 'spanish']);
const METHODS = new Set(['exclude_ties', 'factuality']);

/** What a category means, where its name doesn't say. */
export const CAT_NOTE: Record<string, string> = {
  expert: 'Prompts that need expert knowledge.',
  hard_prompts: 'Prompts that meet most of Arena’s tests for hard ones, such as being specific and complex and needing real problem solving.',
  longer_query: 'Prompts of 500 tokens or more.',
  exclude_ties: 'The same votes with every tie left out.',
  factuality:
    'Arena checks the claims in a sample of replies with search agents, and the reply whose claims hold up better wins that battle. The rating mixes those results with the votes, with the checks at 25%.',
};

// names that keep their capitals inside a sentence
const PROPER = new Set(['webdev-html', 'webdev-react', '3d_modeling']);
const groupOf = (k: string): CatGroup => (METHODS.has(k) ? 'Method' : LANGUAGES.has(k) ? 'Language' : k.startsWith('industry_') ? 'Industry' : 'Task');
const nameOf = (k: string) =>
  NAME.get(k) ??
  k
    .replace(/^industry_/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

export interface CatView {
  key: string;
  name: string;
  /** A CatGroup for an arena's categories, or the importer's own group name for a benchmark's parts. */
  group: string;
  /** Each model's best rating in this category, best first. */
  board: Score[];
}

/** A category's name inside a sentence: "coding", but "HTML" and "Chinese". */
export const inlineName = (v: CatView) => (v.group === 'Language' || PROPER.has(v.key) ? v.name : v.name.toLowerCase());

/** Every category the board keeps for a benchmark, in the switch's order. A category needs three rated models. */
export function arenaCategories(id: string): CatView[] {
  const rows = leaderboardScores.filter((x) => x.benchmark === id && x.metrics);
  const keys = new Set(rows.flatMap((x) => Object.keys(x.metrics!).filter((k) => k.startsWith('cat:'))));
  const views: CatView[] = [];
  for (const full of keys) {
    const best = new Map<string, Score>();
    for (const x of rows) {
      const v = x.metrics![full];
      if (!Number.isFinite(v)) continue;
      const had = best.get(x.model);
      if (!had || v > had.value) best.set(x.model, { ...x, value: v });
    }
    const key = full.slice(4);
    if (best.size >= 3) views.push({ key, name: nameOf(key), group: groupOf(key), board: [...best.values()].sort((a, b) => b.value - a.value) });
  }
  const gi = (g: string) => (CAT_GROUPS as string[]).indexOf(g);
  return views.sort((a, b) => gi(a.group) - gi(b.group) || (ORDER.get(a.key) ?? 999) - (ORDER.get(b.key) ?? 999) || a.name.localeCompare(b.name));
}
