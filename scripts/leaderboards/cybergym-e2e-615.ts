// The older 615-task cohort has distinct denominators. Budget caps remain settings, not measured costs.
import board, {fetchCyberGymE2ERows} from './cybergym-e2e.ts';
export default {...board, benchmark:'cybergym-e2e-615', feed:'https://www.cybergym.io/assets/data/cybergym-e2e.json (615-task cohort, S3)', fetch:()=>fetchCyberGymE2ERows(615)};
