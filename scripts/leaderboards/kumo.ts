// KUMO tests whether a model can identify hidden facts by querying a generated reasoning game.
// The authors' leaderboard publishes average success and relative action count across 100 environments.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://huggingface.co/spaces/zhwang4ai/GenerativeReasoningBenchmark';
const base = url + '/raw/main/data/';
const feed = base + 'success_rate_0402.json';
const environmentStats = Object.fromEntries(['RelicEnv', 'HerbEnv', 'TransdimensionalEnv', 'SorcererEnv', 'QuantumEnv', 'AstronomyEnv', 'MusicGenresEnv', 'CloudEnv', 'CuisineEnv', 'PlantEnv', 'HistoricalEnv', 'GadgetEnv', 'TimeTravelEnv', 'PollutionEnv', 'DemographicEnv', 'GeneticEnv', 'CraftsmanEnv', 'StarConstellationEnv', 'MythicalCreatureEnv', 'ArtStyleEnv', 'CookingEnv', 'HistoricalBattleEnv', 'FungalEnv', 'CryptographyEnv', 'StorageEnv', 'RoverEnv', 'FashionEnv', 'LicenseEnv', 'VirusClassificationEnv', 'TestingEnv', 'NarrativeDetectEnv', 'RenewableEnergyEnv', 'CelestialEnv', 'SpiceEnv', 'WildlifeEnv', 'VehicleEnv', 'BeverageEnv', 'ControlEnv', 'CurrencyEnv', 'MarketingEnv', 'BotanicalEnv', 'CircusActEnv', 'AudioDialectEnv', 'LeadershipEnv', 'TransportEnv', 'EcologicalEnv', 'MythicEnv', 'EnzymeEnv', 'OSKernelEnv', 'MineralClassificationEnv', 'EconomicEnv', 'DetectiveEnv', 'ChessEnv', 'MythicalEnv', 'ChemicalCompoundsEnv', 'ArchitecturalEnv', 'ComputationEnv', 'MachinePartEnv', 'LiteraryEnv', 'MarineEnv', 'PhilosophyEnv', 'ArchaeologicalEnv', 'GemstoneEnv', 'MicrobiologyEnv', 'SciFiEnv', 'HormoneEnv', 'SculptorEnv', 'NeuroEnv', 'OceanEnv', 'MineralEnv', 'FishEnv', 'MartialArtsEnv', 'RocketFuelEnv', 'MLEnv', 'PoliticalManifestoEnv', 'CoffeeEnv', 'MotifAnalysisEnv', 'NutritionEnv', 'MalwareEnv', 'GeologicalEnv', 'TheatricalEnv', 'PrintingTechniqueEnv', 'StellarEnv', 'SoilEnv', 'SoftwareEnv', 'CarIdentificationEnv', 'PharmaceuticalEnv', 'NetworkEnv', 'BirdNestEnv', 'EnergyEnv', 'LanguageEnv', 'AlgorithmEnv', 'MathematicalEnv', 'MusicalEnv', 'InventorEnv', 'MedicalEnv', 'MusicEnv', 'FantasyEnv', 'EducationEnv', 'ChemicalEnv'].map(key => [key + 'RelativeActionCount', { name: key.replace(/Env$/, '') + ' relative action count', unit: 'score', better: 'lower' }]));

type Results = Record<string, Record<string, number>>;
const board: Leaderboard = {
  benchmark: 'kumo', url, feed,
  terms: 'The authors label their leaderboard Apache 2.0 at https://huggingface.co/spaces/zhwang4ai/GenerativeReasoningBenchmark/blob/main/README.md.',
  stats: {relativeActionCount:{name:'Relative action count',unit:'score',better:'lower'}, ...Object.fromEntries(Object.entries(environmentStats).map(([key,value]) => [key, key.startsWith('OSKernel') ? {...value, name: value.name.replace('OSKernel', 'Operating system kernel')} : key.startsWith('ML') ? {...value, name: value.name.replace('ML', 'Machine learning')} : value]))},
  aliases: { 'mistral-large-instruct-2411': 'mistral-large-2-nov-2024', 'deepseek-r1 (snapshot unspecified)': 'deepseek-r1' },
  async fetch() {
    const rates = await fetchJson<Results>(feed);
    const counts = await fetchJson<Results>(base + 'action_count_0402.json');
    const environments = Object.keys(rates).filter(k => k !== 'Average');
    if (!rates.Average || !counts.Average || environments.length < 100) throw new Error('Incomplete KUMO board');
    board.parts = Object.fromEntries(environments.map(k => [k, k]));
    return checked(Object.entries(rates.Average).map(([model, average]) => {
      const metrics: Record<string, number> = { relativeActionCount: counts.Average[model] };
      for (const key of environments) {
        metrics[key] = rates[key][model] * 100;
        metrics[key + 'RelativeActionCount'] = counts[key]?.[model];
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing KUMO data for ' + model);
      return { model, score: average * 100, metrics };
    }), 15);
  },
};
export default board;
