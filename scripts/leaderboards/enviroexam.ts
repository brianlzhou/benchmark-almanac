// EnviroExam ranks models by mean accuracy discounted for variation across 42 courses. The paper's Figures 8 and 9 distinguish the two shot settings that the dataset card duplicates.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://arxiv.org/pdf/2405.11265";

const COURSES = [
  'environmental_science', 'environmental_fluid_mechanics', 'environmental_analytical_chemistry', 'principles_and_applications_of_ecology', 'pollution_control_microbiology', 'atmospheric_pollution_control_engineering',
  'environmental_monitoring', 'environmental_impact_assessment', 'urban_water_supply_and_drainage_system_engineering', 'environmental_soil_science', 'environmental_economics', 'environmental_decision_support_system',
  'solid_waste_treatment_and_resource_utilization', 'water_pollution_control_engineering', 'environmental_planning_and_management', 'indoor_environmental_pollution_and_control', 'environmental_statistics', 'industrial_ecology',
  'environmental_physical_pollution_and_control', 'environmental_nanotechnology', 'specialty_wastewater_treatment', 'modern_biology', 'theory_and_technology_of_environmental_pollution_prevention_and_control', 'reaction_kinetics_and_reactor_design',
  'engineering_ethics_and_environmental_ethics', 'sludge_treatment_disposal_and_resource_utilization', 'safe_disposal_and_resource_recovery_of_hazardous_waste', 'theory_and_technology_of_air_pollution_prevention_and_control', 'environmental_geographic_information_system', 'clean_production_and_energy_conservation_and_emissions_reduction',
  'circulate_economy_and_industrial_ecology_methodologies', 'atmospheric_particulate_matter_detection_and_analysis_techniques', 'environmental_electrochemical_theory_and_technology', 'environmental_microwave_chemistry_technology', 'advanced_environmental_chemistry', 'mass_transfer_processes',
  'carbon_neutrality_theory_and_technology', 'environmental_biotechnology', 'modern_detection_techniques', 'environmental_pollution_investigation_and_tracing', 'persistent_organic_pollutants', 'environmental_behavior_of_atmospheric_science_and_climate_change',
];

const board: Leaderboard = {
  benchmark: "enviroexam", static: 'paper',
  url: "https://huggingface.co/datasets/enviroscientist/EnviroExam#leaderboard",
  feed: FEED,
  terms: "The dataset card specifies MIT. Its two score tables repeat identical rows. Check against the paper before import. https://huggingface.co/datasets/enviroscientist/EnviroExam Hugging Face allows crawling in robots.txt. Scores are credited to the EnviroExam authors.",
  parts: Object.fromEntries(COURSES.map((c) => [c, { name: c.replaceAll('_', ' '), unit: '%' as const }])),
  stats: { '1-cv': { name: 'One minus coefficient of variation', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' }, cv: { name: 'Coefficient of variation', unit: 'score', better: 'lower', note: 'Reported from 0 to 1.' }, mean: { name: 'Mean score', unit: '%', better: 'higher' } },
  async fetch() {
    const card = tables(await fetchText(board.url)).find((t) => t[0].at(-1)?.text === 'M*(1-cv)');
    if (!card || card.length !== 32) throw new Error('Expected 31 EnviroExam model labels');
    const models = card.slice(1);
    const paper = (await pdfText(FEED)).split('Details of 5-shot and 0-shot evaluations for 31 LLMs').at(-1)!;
    const figures = paper.split(/Figure 8: Detail scores for each subject in 5-shot/);
    if (figures.length !== 2) throw new Error('Missing EnviroExam appendix figures');
    let courseCount = 0;
    const rows = figures.flatMap((figure, setting) => {
      const block = figure.slice(figure.indexOf('environmental_science'), figure.indexOf('M*(1-cv)') + figure.slice(figure.indexOf('M*(1-cv)')).indexOf('\n'));
      const metrics = models.map(() => ({} as Record<string, number>));
      for (const line of block.trim().split(/\r?\n/)) {
        const [label, ...values] = line.trim().replace(/^\d+\s+(?=[a-z_])/, '').split(/\s+/);
        if (!label) continue;
        if (values.length !== models.length || !values.every((s) => Number.isFinite(Number(s)))) throw new Error(`Invalid EnviroExam row: ${label}`);
        values.forEach((value, i) => { metrics[i][label === 'σ' ? 'std' : label] = Number(value); });
        if (setting === 0 && !['mean', 'σ', 'cv', '1-cv', 'm*(1-cv)'].includes(label.toLowerCase())) courseCount++;
      }
      return models.map((r, i) => {
        const score = metrics[i]['M*(1-cv)'];
        delete metrics[i]['M*(1-cv)'];
        if (!Number.isFinite(score) || (setting === 1 && Number(r.at(-1)!.text) !== score)) throw new Error('Paper and dataset card disagree on zero-shot column order');
        return { model: r[0].text, setting: setting === 0 ? 'Five-shot' : 'Zero-shot', score, metrics: metrics[i] };
      });
    });
    if (courseCount < 42) throw new Error('Incomplete course scores');
    return rows;
  },
};
export default board;
