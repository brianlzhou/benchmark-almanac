// Published Score@1, including stopped runs as zero. Keep each published task reward under its scientific area.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const url = 'https://acceleratebench.com/';
const feed = `${url}assets/results.json`;
interface Entry {name:string; harness:string; effort:string; score:number; ref:number; gm:number; a125:number; a2:number; steps:number|null; tokens:number|null; stopped_tasks:string[]}
interface Task {id: string; name: string; area: string; rewards_percent: (number | null)[]}
const board: Leaderboard = {
  benchmark:'accelerate-bench', harnesses:'system', url, feed,
  terms:'The authors publish this downloadable results file; robots.txt has no restrictions and the project page states no separate extraction terms.',
  parts: {
    gromacs: { name: 'GROMACS', group: 'Molecular simulation & electronic structure' },
    lammps: { name: 'LAMMPS', group: 'Molecular simulation & electronic structure' },
    gpaw: { name: 'GPAW', group: 'Molecular simulation & electronic structure' },
    qe: { name: 'Quantum ESPRESSO', group: 'Molecular simulation & electronic structure' },
    siesta: { name: 'SIESTA', group: 'Molecular simulation & electronic structure' },
    fluidity: { name: 'Fluidity', group: 'Fluids, atmosphere & ocean' },
    icon: { name: 'ICON', group: 'Fluids, atmosphere & ocean' },
    mpasA: { name: 'MPAS-A', group: 'Fluids, atmosphere & ocean' },
    nemo: { name: 'NEMO', group: 'Fluids, atmosphere & ocean' },
    openfoam: { name: 'OpenFOAM', group: 'Fluids, atmosphere & ocean' },
    palabos: { name: 'Palabos', group: 'Fluids, atmosphere & ocean' },
    su2: { name: 'SU2', group: 'Fluids, atmosphere & ocean' },
    openmc: { name: 'OpenMC', group: 'Transport, plasma & astronomy' },
    shengbte: { name: 'ShengBTE', group: 'Transport, plasma & astronomy' },
    vpic: { name: 'VPIC', group: 'Transport, plasma & astronomy' },
    presto: { name: 'PRESTO', group: 'Transport, plasma & astronomy' },
    abyss: { name: 'ABySS', group: 'Bioinformatics & phylogenetics' },
    mhm2: { name: 'MHM2', group: 'Bioinformatics & phylogenetics' },
    mrbayes: { name: 'MrBayes', group: 'Bioinformatics & phylogenetics' },
    wtdbg2: { name: 'wtdbg2', group: 'Bioinformatics & phylogenetics' },
    hpcg: { name: 'HPCG-derived', group: 'Numerics, tensors & graphs' },
    hpl: { name: 'HPL-derived', group: 'Numerics, tensors & graphs' },
    ipcc22Sparsify: { name: 'Graph sparsification', group: 'Numerics, tensors & graphs' },
    minivite: { name: 'miniVite', group: 'Numerics, tensors & graphs' },
    pac2020Nufft: { name: 'NUFFT imaging', group: 'Numerics, tensors & graphs' },
    pacTensor: { name: 'Tucker reconstruction', group: 'Numerics, tensors & graphs' },
    quest: { name: 'QuEST', group: 'Quantum circuits' },
    asc26Qibotn: { name: 'QiboTN', group: 'Quantum circuits' },
    pacMqa: { name: 'Paged LM generation', group: 'Machine learning' },
    pacThundersvm: { name: 'ThunderSVM', group: 'Machine learning' },
    datalife: { name: 'DataLife', group: 'Scientific I/O' },
    io500: { name: 'IO500-derived', group: 'Scientific I/O' },
  },
  stats: {
    referenceScore: { name: 'Reference score', unit: 'score', better: 'higher' },
    geometricMeanSpeedup: { name: 'Geometric mean speedup', unit: 'speedup', better: 'higher' },
    accuracy125: { name: 'Accuracy at 1.25', unit: '%', better: 'higher' },
    accuracy2: { name: 'Accuracy at 2', unit: '%', better: 'higher' },
    stoppedTasks: { name: 'Stopped tasks', unit: 'count' },
  },
  async fetch():Promise<LeaderboardRow[]> {
    const d=await fetchJson<{models:Entry[]; tasks:Task[]}>(feed);
    const tasks = d.tasks.map(task => ({
      ...task,
      key: task.id.replace(/_cpu$/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase()),
    }))
    if (tasks.some(task => task.rewards_percent.length !== d.models.length)) throw new Error('Task reward columns changed')
    const rows=d.models.map((r, i)=>({model:r.name,harness:r.harness,setting:`${r.effort} effort, benchmark v1.1`,score:r.score,trials:1,
      metrics:{...Object.fromEntries(tasks.flatMap(task => typeof task.rewards_percent[i] === 'number' ? [[task.key, task.rewards_percent[i]]] : [])),referenceScore:r.ref,geometricMeanSpeedup:r.gm,accuracy125:r.a125,accuracy2:r.a2,stoppedTasks:r.stopped_tasks.length,...(r.steps==null?{}:{steps:r.steps}),...(r.tokens==null?{}:{reportedTokens:r.tokens})}}));
    if(rows.length<3 || rows.some(r=>!Number.isFinite(r.score)))throw new Error('Accelerate-Bench model scores missing');
    return rows;
  },
};
export default board;
