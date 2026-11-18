// What kind of organization each benchmark maker is, for "Who makes new benchmarks?" on /insights/evals/. A maker is
// one of the parts of a benchmark's `org` credit (src/lib/makers.ts). Labs come from data/labs.json, academia from
// the maker's name, and the other kinds from the lists below, which cover the makers with the most benchmarks.
// A maker on no list and with no telling name stays unclassified rather than guessed.

export type MakerKind = 'lab' | 'academia' | 'eval' | 'data' | 'company' | 'public' | 'person' | 'unclassified';

export const MAKER_KINDS: { id: MakerKind; name: string; note: string }[] = [
  { id: 'lab', name: 'AI labs', note: 'Companies and groups that train and release their own models' },
  { id: 'academia', name: 'Universities and institutes', note: 'Universities, their labs, and public research institutes' },
  { id: 'eval', name: 'Eval orgs', note: 'Groups whose main work is evaluating or ranking AI, such as Vals AI, Epoch AI and METR' },
  { id: 'data', name: 'Data vendors', note: 'Companies that sell training data, expert labeling or raters to labs, such as Scale AI and Mercor' },
  { id: 'company', name: 'Other companies', note: 'AI products and startups that release no models of their own, and companies outside AI' },
  { id: 'public', name: 'Government and nonprofits', note: 'Government institutes, nonprofits, exam boards and open communities' },
  { id: 'person', name: 'Independent researchers', note: 'People working on their own' },
];

/** Labs in data/labs.json that are universities: they count as academia. */
const ACADEMIC_LABS = new Set(['tsinghua-university', 'swiss-ai', 'cmu', 'uw-madison', 'hust', 'nyu', 'mbzuai', 'uc-berkeley', 'princeton', 'stanford', 'hku', 'tiger-lab']);

const EVAL = new Set([
  'vals-ai', 'artificial-analysis', 'designarena', 'kaggle', 'opencompass', 'arena', 'matharena', 'epoch-ai', 'securebio', 'agi-eval',
  'voice-arena', 'unipat-ai', 'xbench', 'metr', 'andon-labs', 'cekura', 'laude-institute', 'thoughtful-lab', 'robocurve', 'patronus-ai',
  'gray-swan', 'gray-swan-ai', 'gray-swan-for-google-deepmind', 'apollo-research', 'arc-prize-foundation', 'irregular', 'harbor',
  'mlcommons', 'coval', 'studyarena', 'galileo', 'benchflow', 'eval-sys', 'interactivebench', 'voxelbench',
]);
const DATA = new Set(['scale-ai', 'surge-ai', 'mercor', 'snorkel-ai', 'micro1', 'handshake-ai-research', 'humanlaya-data-lab', 'afterquery', 'collinear-ai', '2077ai', 'humanlaya', 'turing', 'toloka', 'invisible', 'appen', 'prolific', 'labelbox']);
const PUBLIC = new Set([
  'uk-ai-security-institute', 'uk-aisi', 'center-for-ai-safety', 'cais', 'mathematical-association-of-america', 'college-board', 'ets', 'usmle',
  'ncbe', 'court-of-master-sommeliers', 'chinese-mathematical-society', 'international-mathematical-olympiad', 'wmt', 'masakhane',
  'mteb-community', 'community-contributors', 'futurehouse', 'redwood-research', 'kora', 'openrsi-foundation', 'first-proof-foundation',
  'clue-benchmark-team', 'm-a-p', 'multimodal-art-projection', 'open-arabic-llm-leaderboard-team', 'the-atticus-project', 'numina', 'nist',
  'bigcode-project', 'the-african-research-collective',
]);
const COMPANY = new Set([
  'sierra', 'servicenow-research', 'servicenow', 'harvey', 'edison-scientific', 'latchbio', 'moneda', 'metastone-technology', 'sakana-ai',
  'j-p-morgan-ai-research', 'vercel', 'adobe-research', 'sony-researchers', 'browser-use', 'bespoke-labs', 'logicstar-ai', 'hume-ai',
  'windsurf', 'llamaindex', 'vectara', 'quantaalpha', 'mobvoi', 'aishell', 'collide-ai', 'frontis-ai', 'agibot', 'thrive-holdings',
  'sword-health', 'omi-health', 'exponential-security-labs', 'general-reasoning', 'hithink-research', 'infinity-lab', 'spherelab',
  'einsia-ai', 'normal-research', 'onelineai', 'skylenage-ai', 'futuresearch', 'quesma', 'proximal', 'elorian', 'motional',
  'positronic-robotics', 'kilo-ai', 'column-tax', 'illuin-technology', '1x-technologies', 'specific-labs', 'dexmal', 'abundant-ai', 'lelapa-ai',
  'perpetual-research', 'bosch-center-for-ai-zou',
]);
const PERSON = new Set(['lech-mazur', 'eq-bench', 'peter-gostev', 'aider', 'laiso']);
/** Maker names that are a lab under another spelling. */
const LAB = new Set(['deepmind', 'gemini-team', 'xiaomi-mimo', 'opengvlab', 'opendatalab', 'shanghai-artificial-intelligence-laboratory', 'allenai', 'kling-ai', 'klingai-research', 'huawei-noah-s-ark-lab', 'thudm', 'shanghai-ai-lab', 'inception']);
/** Academic groups whose names don't say so. */
const ACADEMIC = new Set(['hae-rae', 'guan-ting-lin', 'hung-yi-lee', 'shanghai-innovation-institute', 'critpt-collaboration', 'ofir-press', 'koita-centre-for-digital-health']);

const ACADEMIC_NAME =
  /universit|college|school of|\bacadem|polytechn|institute of (technology|science|automation)|research institute|national lab|hospital|medical cent|max planck|\bmpi\b|inria|cnrs|ellis|\b(mit|cmu|nyu|hku|hkust|kaist|epfl|eth|ucl|uiuc|ucla|ucsd|usc|ucsb|cuhk|sjtu|zju|ustc|nus|ntu|pku|thu|unc|iiit|iit|lmu|mila|bigai|insait)\b|\buc (berkeley|santa|san|irvine|davis|los)|tsinghua|peking|fudan|stanford|berkeley|princeton|harvard|oxford|cambridge|toronto|waterloo|caltech|cornell|ut austin|virginia tech|johns hopkins|yale|columbia|georgia tech|purdue|duke|qatar computing|computer vision center|vector institute/i;

export function makerKind(id: string, text: string, lab?: string, labName?: string): MakerKind {
  if (EVAL.has(id)) return 'eval';
  if (DATA.has(id)) return 'data';
  if (PUBLIC.has(id)) return 'public';
  if (COMPANY.has(id)) return 'company';
  if (PERSON.has(id)) return 'person';
  if (LAB.has(id)) return 'lab';
  if (ACADEMIC.has(id)) return 'academia';
  if (lab) return ACADEMIC_LABS.has(lab) ? 'academia' : 'lab';
  if (ACADEMIC_NAME.test(text) || (labName && ACADEMIC_NAME.test(labName))) return 'academia';
  return 'unclassified';
}
