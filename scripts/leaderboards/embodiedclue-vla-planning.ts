// EmbodiedCLUE-VLA (planning) ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "embodiedclue-vla-planning",
  url: "https://www.superclueai.com/embodied/VLA_brain",
  feed: "https://www.superclueai.com/data/embodied_list/VLA_brain/2026%E5%B9%B49%E6%9C%88.xlsx",
  roundFolder: "VLA_brain",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 10,
  parts: ["基础感知", "视觉推理", "交互与规划", "具身安全"],
  settings: ["使用方式"],
  details: [{"sheet": "10B模型榜", "model": "模型名称", "parts": []}, {"sheet": "基础感知", "model": "模型名称", "parts": ["时间感知", "物体感知", "空间感知"]}, {"sheet": "视觉推理", "model": "模型名称", "parts": ["数学推理", "时间推理", "空间推理", "逻辑推理"]}, {"sheet": "交互与规划", "model": "模型名称", "parts": ["任务规划", "路径规划"]}, {"sheet": "具身安全", "model": "模型名称", "parts": ["伦理遵从性", "物理安全", "隐私保护"]}, {"sheet": "参测模型信息", "model": "标准模型名称", "parts": []}],
});
